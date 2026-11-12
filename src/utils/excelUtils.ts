import * as XLSX from 'xlsx';
import { Student, Dormitory, Room, Bed } from '../types';

// تبدیل اعداد فارسی و عربی به انگلیسی جهت پردازش دقیق
export function toEnglishDigits(str: string | number): string {
  if (str === null || str === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = String(str);
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(persianDigits[i], 'g'), String(i));
    res = res.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  return res;
}

// تعریف نگاشت ستون‌های استاندارد دانشجویان
const KNOWN_STUDENT_FIELD_MAP: Record<string, keyof Student> = {
  'کد دانشجویی': 'studentId',
  'شماره دانشجویی': 'studentId',
  'کددانشجویی': 'studentId',
  'student_id': 'studentId',
  'studentid': 'studentId',

  'کد ملی': 'nationalId',
  'کدملی': 'nationalId',
  'شماره ملی': 'nationalId',
  'national_id': 'nationalId',
  'nationalid': 'nationalId',

  'نام و نام خانوادگی': 'fullName',
  'نام و نام‌خانوادگی': 'fullName',
  'نام خانوادگی و نام': 'fullName',
  'نام کامل': 'fullName',
  'fullname': 'fullName',
  'full_name': 'fullName',
  'name': 'fullName',

  'رشته': 'fieldOfStudy',
  'نام رشته': 'fieldOfStudy',
  'رشته تحصیلی': 'fieldOfStudy',
  'major': 'fieldOfStudy',
  'field_of_study': 'fieldOfStudy',

  'ترم ورود': 'entryTerm',
  'ورودی': 'entryTerm',
  'نیمسال ورود': 'entryTerm',
  'سال ورود': 'entryTerm',
  'entry_term': 'entryTerm',

  'نام پدر': 'fatherName',
  'پدر': 'fatherName',
  'father_name': 'fatherName',

  'تاریخ تولد': 'birthDate',
  'متولد': 'birthDate',
  'birth_date': 'birthDate',

  'استان': 'province',
  'استان محل سکونت': 'province',
  'province': 'province',

  'شهر': 'city',
  'شهر محل سکونت': 'city',
  'شهرستان': 'city',
  'city': 'city',

  'تلفن': 'phone',
  'تلفن ثابت': 'phone',
  'شماره تلفن': 'phone',
  'phone': 'phone',

  'موبایل': 'mobile',
  'همراه': 'mobile',
  'شماره همراه': 'mobile',
  'شماره موبایل': 'mobile',
  'mobile': 'mobile',

  'تلفن ضروری': 'emergencyPhone',
  'شماره ضروری': 'emergencyPhone',
  'شماره اضطراری': 'emergencyPhone',
  'emergency_phone': 'emergencyPhone',

  'تلفن والدین': 'parentPhone',
  'شماره والدین': 'parentPhone',
  'تلفن پدر': 'parentPhone',
  'parent_phone': 'parentPhone',

  'دین و مذهب': 'religion',
  'مذهب': 'religion',
  'دین': 'religion',
  'religion': 'religion',

  'آدرس': 'postalAddress',
  'نشانی': 'postalAddress',
  'آدرس دقیق': 'postalAddress',
  'نشانی منزل': 'postalAddress',
  'address': 'postalAddress',

  'سرای سال قبل': 'previousDorm',
  'خوابگاه سال قبل': 'previousDorm',
  'خوابگاه قبلی': 'previousDorm',
  'previous_dorm': 'previousDorm',

  'اتاق سال قبل': 'previousRoom',
  'اتاق قبلی': 'previousRoom',
  'previous_room': 'previousRoom',

  'امتیاز سال قبل': 'previousScore',
  'امتیاز قبلی': 'previousScore',
  'امتیاز انضباطی/فرهنگی': 'previousScore',
  'previous_score': 'previousScore',

  // ستون‌های تخصیص اتاق و اسکان از قبل توسط مدیر:
  'نام سرا': 'assignedDormName',
  'سرا': 'assignedDormName',
  'خوابگاه': 'assignedDormName',
  'نام خوابگاه': 'assignedDormName',
  'dorm': 'assignedDormName',
  'dormitory': 'assignedDormName',

  'شماره اتاق': 'assignedRoomNumber',
  'اتاق': 'assignedRoomNumber',
  'نام اتاق': 'assignedRoomNumber',
  'room': 'assignedRoomNumber',
  'room_number': 'assignedRoomNumber',

  'شماره تخت': 'assignedBedNumber',
  'تخت': 'assignedBedNumber',
  'bed': 'assignedBedNumber',
  'bed_number': 'assignedBedNumber',
};

// خواندن اکسل دانشجویان
export async function parseStudentExcel(file: File): Promise<{
  students: Student[];
  customColumns: string[];
  totalRows: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('فایل اکسل خالی است یا دارای سطر معتبر نمی‌باشد.');
        }

        const detectedCustomColsSet = new Set<string>();
        const students: Student[] = [];

        rawJson.forEach((row, index) => {
          const studentObj: any = {
            studentId: '',
            nationalId: '',
            fullName: '',
            fieldOfStudy: '',
            entryTerm: '',
            fatherName: '',
            birthDate: '',
            province: '',
            city: '',
            phone: '',
            mobile: '',
            emergencyPhone: '',
            parentPhone: '',
            religion: 'اسلام / شیعه',
            previousDorm: 'عدم سکونت',
            previousRoom: '-',
            previousScore: 100,
            isProfileCompleted: false, // هر دانشجو موظف است به محض ورود به سامانه اطلاعات خود را تکمیل کند
            customFields: {},
          };

          // بررسی تمام ستون‌های سطر
          Object.keys(row).forEach((colName) => {
            const cleanCol = colName.trim();
            const val = row[colName];

            // نگاشت به ستون استاندارد
            const mappedStandardKey = KNOWN_STUDENT_FIELD_MAP[cleanCol] || KNOWN_STUDENT_FIELD_MAP[cleanCol.toLowerCase()];

            if (mappedStandardKey) {
              studentObj[mappedStandardKey] = String(val).trim();
            } else {
              // این یک ستون دلخواه و سفارشی است (مانند گروه خونی، بیماری، علایق، رشته ورزشی و ...)
              if (cleanCol && !cleanCol.startsWith('__EMPTY')) {
                studentObj.customFields[cleanCol] = String(val).trim();
                detectedCustomColsSet.add(cleanCol);
              }
            }
          });

          // اگر نام و نام خانوادگی تفکیک شده بود
          if (!studentObj.fullName && (row['نام'] || row['نام خانوادگی'])) {
            studentObj.fullName = `${row['نام'] || ''} ${row['نام خانوادگی'] || ''}`.trim();
          }

          // اعتبارسنجی حداقلی و تبدیل ارقام فارسی به انگلیسی
          if (!studentObj.studentId && row['id']) {
            studentObj.studentId = String(row['id']).trim();
          }

          if (!studentObj.studentId) {
            // تولید شناسه موقت اگر وجود نداشت
            studentObj.studentId = `402${String(index + 100).padStart(4, '0')}`;
          }

          studentObj.studentId = toEnglishDigits(studentObj.studentId);

          if (!studentObj.nationalId) {
            studentObj.nationalId = String(studentObj.studentId).slice(-10);
          }
          studentObj.nationalId = toEnglishDigits(studentObj.nationalId);

          if (studentObj.phone) studentObj.phone = toEnglishDigits(studentObj.phone);
          if (studentObj.mobile) studentObj.mobile = toEnglishDigits(studentObj.mobile);
          if (studentObj.emergencyPhone) studentObj.emergencyPhone = toEnglishDigits(studentObj.emergencyPhone);
          if (studentObj.parentPhone) studentObj.parentPhone = toEnglishDigits(studentObj.parentPhone);

          // تولید آواتار رنگی
          const colors = ['#0d9488', '#0284c7', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];
          studentObj.avatarColor = colors[index % colors.length];

          // بررسی و تعیین وضعیت اسکان بر اساس پر یا خالی بودن ستون‌های اکسل
          const cleanDorm = String(studentObj.assignedDormName || '').trim();
          const cleanRoom = toEnglishDigits(String(studentObj.assignedRoomNumber || '')).trim();
          const cleanBedRaw = toEnglishDigits(String(studentObj.assignedBedNumber || '')).trim();

          if (cleanRoom && cleanBedRaw) {
            // اگر ستون‌های اسکان پر بود یعنی قبلاً توسط مدیر ساماندهی شده است (و دانشجو می‌تواند بعداً درخواست تغییر اتاق/تخت بدهد)
            const bedNum = parseInt(cleanBedRaw, 10);
            studentObj.assignmentStatus = 'confirmed';
            studentObj.assignedDormName = cleanDorm;
            studentObj.assignedRoomNumber = cleanRoom;
            studentObj.assignedBedNumber = isNaN(bedNum) ? cleanBedRaw : bedNum;
          } else {
            // اگر ستون‌ها خالی بود یعنی خود دانشجو باید وارد سامانه شده و اتاق را انتخاب کند
            studentObj.assignmentStatus = 'none';
            studentObj.assignedDormName = undefined;
            studentObj.assignedRoomNumber = undefined;
            studentObj.assignedBedNumber = undefined;
          }

          students.push(studentObj as Student);
        });

        resolve({
          students,
          customColumns: Array.from(detectedCustomColsSet),
          totalRows: students.length,
        });
      } catch (err: any) {
        reject(new Error(`خطا در پردازش فایل اکسل: ${err.message || err}`));
      }
    };

    reader.onerror = () => reject(new Error('خطا در خواندن فایل اکسل.'));
    reader.readAsBinaryString(file);
  });
}

// خواندن اکسل سراها و اتاق‌ها
export async function parseDormitoryExcel(file: File): Promise<{
  dorms: Dormitory[];
  rooms: Room[];
  beds: Bed[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('فایل اکسل سراها خالی است.');
        }

        const dormsMap = new Map<string, Dormitory>();
        const rooms: Room[] = [];
        const beds: Bed[] = [];

        rawJson.forEach((row, index) => {
          const dormName = String(row['نام سرا'] || row['نام خوابگاه'] || row['خوابگاه'] || 'سرای مرکزی').trim();
          const campus = String(row['پردیس'] || 'پردیس شهید باهنر اصفهان').trim();
          const genderRaw = String(row['جنسیت'] || 'برادران').trim();
          const gender: 'brothers' | 'sisters' = genderRaw.includes('خواهر') || genderRaw.includes('دختر') ? 'sisters' : 'brothers';

          const dormId = `dorm_${dormName.replace(/\s+/g, '_')}`;

          if (!dormsMap.has(dormId)) {
            dormsMap.set(dormId, {
              id: dormId,
              name: dormName,
              campus,
              gender,
              totalFloors: 3,
              description: `مجموعه خوابگاهی دانشجویی ${dormName} واقع در ${campus}`,
            });
          }

          const roomNumber = String(row['نام اتاق'] || row['شماره اتاق'] || row['اتاق'] || (101 + index)).trim();
          const floor = Number(row['طبقه'] ?? (parseInt(roomNumber[0], 10) || 1));
          const capacity = Number(row['تعداد تخت'] || row['ظرفیت'] || 4);
          const facilitiesRaw = String(row['امکانات'] || 'یخچال، شوفاژ، کمد دیواری، اینترنت وای‌فای').trim();
          const allowedFieldsRaw = String(row['سهمیه رشته'] || row['رشته‌های مجاز'] || '').trim();
          const allowedTermsRaw = String(row['سهمیه ورودی'] || row['ورودی‌های مجاز'] || '').trim();

          const roomId = `${dormId}_r${roomNumber}`;

          const allowedFields = allowedFieldsRaw ? allowedFieldsRaw.split(/[,،-]/).map((s) => s.trim()).filter(Boolean) : undefined;
          const allowedEntryTerms = allowedTermsRaw ? allowedTermsRaw.split(/[,،-]/).map((s) => s.trim()).filter(Boolean) : undefined;
          const facilities = facilitiesRaw.split(/[,،-]/).map((s) => s.trim()).filter(Boolean);

          const room: Room = {
            id: roomId,
            dormId,
            roomNumber,
            floor: isNaN(floor) ? 1 : floor,
            capacity: isNaN(capacity) || capacity < 2 ? 4 : capacity,
            facilities: facilities.length ? facilities : ['یخچال', 'شوفاژ', 'کمد دیواری'],
            allowedFields,
            allowedEntryTerms,
            notes: String(row['توضیحات'] || ''),
          };

          rooms.push(room);

          // ساخت تخت‌های دوطبقه با رعایت قاعده: شماره فرد = طبقه پایین | شماره زوج = طبقه بالا
          const numBunkPairs = Math.ceil(room.capacity / 2);
          let bedIndex = 1;

          for (let b = 1; b <= numBunkPairs; b++) {
            // تخت طبقه پایین (شماره فرد مثلاً ۱، ۳، ۵، ۷)
            if (bedIndex <= room.capacity) {
              beds.push({
                id: `${roomId}_b${b}_lower`,
                roomId,
                dormId,
                bunkNumber: b,
                bedNumber: bedIndex,
                tier: 'lower',
                label: `تخت ${bedIndex} (طبقه پایین)`,
                studentId: null,
              });
              bedIndex++;
            }

            // تخت طبقه بالا (شماره زوج مثلاً ۲، ۴، ۶، ۸)
            if (bedIndex <= room.capacity) {
              beds.push({
                id: `${roomId}_b${b}_upper`,
                roomId,
                dormId,
                bunkNumber: b,
                bedNumber: bedIndex,
                tier: 'upper',
                label: `تخت ${bedIndex} (طبقه بالا)`,
                studentId: null,
              });
              bedIndex++;
            }
          }
        });

        resolve({
          dorms: Array.from(dormsMap.values()),
          rooms,
          beds,
        });
      } catch (err: any) {
        reject(new Error(`خطا در خواندن فایل اکسل سراها: ${err.message || err}`));
      }
    };

    reader.onerror = () => reject(new Error('خطا در بارگذاری فایل اکسل سراها.'));
    reader.readAsBinaryString(file);
  });
}

// دانلود فایل اکسل نمونه دانشجویان با ستون‌های اسکان اختیاری
export function downloadStudentTemplate() {
  const sampleData = [
    {
      'کد دانشجویی': '4021234001',
      'کد ملی': '1271234567',
      'نام و نام خانوادگی': 'امیرحسین رضایی',
      'نام رشته': 'آموزش ابتدایی',
      'ترم ورود': '۴۰۲۱',
      'نام پدر': 'محمد',
      'تاریخ تولد': '1383/04/15',
      'استان محل سکونت': 'اصفهان',
      'شهر محل سکونت': 'کاشان',
      'شماره تلفن': '03155443322',
      'شماره همراه': '09131234567',
      'شماره ضروری': '09137654321',
      'شماره والدین': '09139876543',
      'دین و مذهب': 'اسلام / شیعه',
      'سرای سال قبل': 'سرای شهید باهنر',
      'اتاق سال قبل': '۱۰۴',
      'امتیاز سال قبل': '95',
      // ستون‌های تخصیص اتاق (پر شده: تخصیص قطعی توسط مدیر | فرد=پایین، زوج=بالا)
      'نام سرا': 'سرای شهید باهنر - بلوک سینا',
      'شماره اتاق': '۱۰۱',
      'شماره تخت': 1, // فرد: طبقه پایین
      // ستون‌های سفارشی اختیاری
      'گروه خونی': 'O+',
      'رشته ورزشی': 'والیبال',
      'بیماری خاص': 'ندارد',
      'علایق فرهنگی': 'خطاطی و سرود',
    },
    {
      'کد دانشجویی': '4021234002',
      'کد ملی': '1289876543',
      'نام و نام خانوادگی': 'محمدصادق حسینی',
      'نام رشته': 'آموزش ریاضی',
      'ترم ورود': '۴۰۲۱',
      'نام پدر': 'علی',
      'تاریخ تولد': '1382/09/20',
      'استان محل سکونت': 'چهارمحال و بختیاری',
      'شهر محل سکونت': 'شهرکرد',
      'شماره تلفن': '03833221100',
      'شماره همراه': '09132223344',
      'شماره ضروری': '09133334455',
      'شماره والدین': '09134445566',
      'دین و مذهب': 'اسلام / شیعه',
      'سرای سال قبل': 'عدم سکونت (ورودی جدید)',
      'اتاق سال قبل': '-',
      'امتیاز سال قبل': '100',
      // ستون‌های تخصیص اتاق خالی: خود دانشجو در سامانه اتاق انتخاب می‌کند
      'نام سرا': '',
      'شماره اتاق': '',
      'شماره تخت': '',
      'گروه خونی': 'A+',
      'رشته ورزشی': 'شطرنج',
      'بیماری خاص': 'حساسیت فصلی',
      'علایق فرهنگی': 'شعر و ادب',
    },
    {
      'کد دانشجویی': '4011234003',
      'کد ملی': '1294567890',
      'نام و نام خانوادگی': 'علیرضا صادقی',
      'نام رشته': 'آموزش زبان و ادبیات فارسی',
      'ترم ورود': '۴۰۱۱',
      'نام پدر': 'حسین',
      'تاریخ تولد': '1381/11/02',
      'استان محل سکونت': 'یزد',
      'شهر محل سکونت': 'میبد',
      'شماره تلفن': '03532345678',
      'شماره همراه': '09135556677',
      'شماره ضروری': '09136667788',
      'شماره والدین': '09137778899',
      'دین و مذهب': 'اسلام / شیعه',
      'سرای سال قبل': 'سرای شهید باهنر',
      'اتاق سال قبل': '۲۰۲',
      'امتیاز سال قبل': '90',
      // ستون‌های تخصیص اتاق: تخت زوج = طبقه بالا
      'نام سرا': 'سرای شهید باهنر - بلوک سینا',
      'شماره اتاق': '۱۰۱',
      'شماره تخت': 2, // زوج: طبقه بالا
      'گروه خونی': 'B+',
      'رشته ورزشی': 'فوتسال',
      'بیماری خاص': 'ندارد',
      'علایق فرهنگی': 'تئاتر و نمایش',
    },
    {
      'کد دانشجویی': '4011234004',
      'کد ملی': '1299988776',
      'نام و نام خانوادگی': 'مهدی یوسفی',
      'نام رشته': 'آموزش شیمی',
      'ترم ورود': '۴۰۱۱',
      'نام پدر': 'اکبر',
      'تاریخ تولد': '1381/08/14',
      'استان محل سکونت': 'لرستان',
      'شهر محل سکونت': 'خرم‌آباد',
      'شماره تلفن': '06633221199',
      'شماره همراه': '09161112233',
      'شماره ضروری': '09162223344',
      'شماره والدین': '09163334455',
      'دین و مذهب': 'اسلام / شیعه',
      'سرای سال قبل': 'سرای شهید باهنر',
      'اتاق سال قبل': '۱۰۱',
      'امتیاز سال قبل': '94',
      // ستون‌های تخصیص اتاق: تخت فرد = طبقه پایین
      'نام سرا': 'سرای شهید باهنر - بلوک سینا',
      'شماره اتاق': '۱۰۱',
      'شماره تخت': 3, // فرد: طبقه پایین
      'گروه خونی': 'AB+',
      'رشته ورزشی': 'شنا',
      'بیماری خاص': 'ندارد',
      'علایق فرهنگی': 'موسیقی سنتی',
    },
    {
      'کد دانشجویی': '4021234005',
      'کد ملی': '1270011223',
      'نام و نام خانوادگی': 'سینا فلاحی',
      'نام رشته': 'آموزش فیزیک',
      'ترم ورود': '۴۰۲۱',
      'نام پدر': 'رضا',
      'تاریخ تولد': '1383/02/10',
      'استان محل سکونت': 'کرمان',
      'شهر محل سکونت': 'رفسنجان',
      'شماره تلفن': '03434221100',
      'شماره همراه': '09138889900',
      'شماره ضروری': '09139990011',
      'شماره والدین': '09137770022',
      'دین و مذهب': 'اسلام / شیعه',
      'سرای سال قبل': 'عدم سکونت',
      'اتاق سال قبل': '-',
      'امتیاز سال قبل': '100',
      // ستون‌های تخصیص اتاق: خالی (دانشجو خود در سامانه اتاق و تخت انتخاب می‌کند)
      'نام سرا': '',
      'شماره اتاق': '',
      'شماره تخت': '',
      'گروه خونی': 'O-',
      'رشته ورزشی': 'تنیس روی میز',
      'بیماری خاص': 'ندارد',
      'علایق فرهنگی': 'عکاسی',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'دانشجویان');
  XLSX.writeFile(wb, 'قالب_اکسل_اطلاعات_دانشجویان_با_ستون_اسکان.xlsx');
}

// دانلود فایل اکسل نمونه سراها و اتاق‌ها
export function downloadDormitoryTemplate() {
  const sampleDormData = [
    {
      'نام سرا': 'سرای شهید باهنر - بلوک سینا',
      'پردیس': 'پردیس شهید باهنر اصفهان',
      'جنسیت': 'برادران',
      'شماره اتاق': '۱۰۱',
      'طبقه': '۱',
      'تعداد تخت': '۴',
      'سهمیه رشته': 'آموزش ابتدایی, آموزش ریاضی',
      'سهمیه ورودی': '۴۰۲۱, ۴۰۲۲',
      'امکانات': 'یخچال, بالکن, شوفاژ, کولر, کمد دیواری, اینترنت',
      'توضیحات': 'رو به آفتاب و آرام',
    },
    {
      'نام سرا': 'سرای شهید باهنر - بلوک سینا',
      'پردیس': 'پردیس شهید باهنر اصفهان',
      'جنسیت': 'برادران',
      'شماره اتاق': '۱۰۲',
      'طبقه': '۱',
      'تعداد تخت': '۶',
      'سهمیه رشته': '',
      'سهمیه ورودی': '',
      'امکانات': 'یخچال, شوفاژ, کولر, کمد دیواری, اینترنت',
      'توضیحات': 'عمومی برای تمام رشته‌ها',
    },
    {
      'نام سرا': 'سرای فاطمه الزهرا (س) - بلوک کوثر',
      'پردیس': 'پردیس فاطمه الزهرا (س)',
      'جنسیت': 'خواهران',
      'شماره اتاق': '۲۰۱',
      'طبقه': '۲',
      'تعداد تخت': '۴',
      'سهمیه رشته': 'آموزش کودکان استثنایی, آموزش زبان انگلیسی',
      'سهمیه ورودی': '۴۰۱۱, ۴۰۲۱',
      'امکانات': 'یخچال, بالکن, شوفاژ, کمد دیواری, میز مطالعه',
      'توضیحات': 'مجهز به دو میز مطالعه',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleDormData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'سراها و اتاق‌ها');
  XLSX.writeFile(wb, 'قالب_اکسل_سراها_و_اتاق_های_خوابگاه.xlsx');
}

// خروجی گزارش تخت‌های خالی به اکسل
export function exportVacantBedsToExcel(
  vacantBeds: {
    dormName: string;
    campus: string;
    roomNumber: string;
    floor: number;
    bedLabel: string;
    tier: string;
    roomCapacity: number;
    allowedFields?: string;
  }[]
) {
  const data = vacantBeds.map((b, idx) => ({
    'ردیف': idx + 1,
    'نام سرا': b.dormName,
    'پردیس': b.campus,
    'شماره اتاق': b.roomNumber,
    'طبقه': b.floor === 0 ? 'همکف' : `طبقه ${b.floor}`,
    'عنوان تخت': b.bedLabel,
    'نوع طبقه تخت': b.tier === 'lower' ? 'پایین' : 'بالا',
    'ظرفیت کل اتاق': b.roomCapacity,
    'سهمیه مجاز': b.allowedFields || 'آزاد برای همه',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'تخت‌های خالی');
  XLSX.writeFile(wb, `گزارش_تخت_های_خالی_سراهای_فرهنگیان_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// خروجی لیست کلیه دانشجویان با فیلدهای پویا
export function exportStudentsToExcel(students: Student[], dormsMap: Map<string, string>, roomsMap: Map<string, string>) {
  const data = students.map((s, idx) => {
    const base: Record<string, any> = {
      'ردیف': idx + 1,
      'شماره دانشجویی': s.studentId,
      'کد ملی': s.nationalId,
      'نام و نام خانوادگی': s.fullName,
      'رشته تحصیلی': s.fieldOfStudy,
      'ترم ورود': s.entryTerm,
      'استان': s.province,
      'شهر': s.city,
      'شماره همراه': s.mobile,
      'شماره ضروری': s.emergencyPhone,
      'شماره والدین': s.parentPhone,
      'نشانی دقیق': s.postalAddress || '',
      'سرای تخصیص یافته': s.assignedDormId ? dormsMap.get(s.assignedDormId) || s.assignedDormId : 'تخصیص نیافته',
      'اتاق تخصیص یافته': s.assignedRoomId ? roomsMap.get(s.assignedRoomId) || s.assignedRoomId : 'تخصیص نیافته',
      'وضعیت پروفایل': s.isProfileCompleted ? 'تکمیل شده' : 'ناقص',
    };

    // اضافه کردن تمام ستون‌های سفارشی به اکسل
    if (s.customFields) {
      Object.entries(s.customFields).forEach(([key, val]) => {
        base[key] = val;
      });
    }

    return base;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'لیست دانشجویان');
  XLSX.writeFile(wb, `لیست_جامع_دانشجویان_سراها_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// خروجی اکسل گزارش ارجاعی و عملکرد حوزه‌ها در بازه زمانی دلخواه
export function exportDomainReportToExcel(
  items: Array<{
    trackingCode: string;
    domainName: string;
    title: string;
    dormName: string;
    location: string;
    requester: string;
    assignee: string;
    createdDate: string;
    resolvedDate?: string;
    statusLabel: string;
    cost: number;
    notes?: string;
  }>,
  domainFilterName: string,
  dateRangeLabel: string
) {
  const data = items.map((item, idx) => ({
    'ردیف': idx + 1,
    'کد پیگیری': item.trackingCode,
    'حوزه': item.domainName,
    'عنوان و شرح کار': item.title,
    'نام سرا': item.dormName,
    'مکان دقیق / شماره اتاق': item.location,
    'ثبت‌کننده': item.requester,
    'مجری / مسئول رسیدگی': item.assignee,
    'تاریخ ارجاع': item.createdDate,
    'تاریخ رفع / انجام': item.resolvedDate || '-',
    'وضعیت نهایی': item.statusLabel,
    'هزینه (ریال)': item.cost,
    'توضیحات و اقدامات': item.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'گزارش عملکرد حوزه');
  
  const safeDomain = domainFilterName.replace(/[\\/:*?"<>|]/g, '_');
  XLSX.writeFile(wb, `گزارش_عملکرد_${safeDomain}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// نگاشت روزهای هفته به فارسی و انگلیسی
const DAY_FA_MAP: Record<string, string> = {
  saturday: 'شنبه',
  sunday: 'یکشنبه',
  monday: 'دوشنبه',
  tuesday: 'سه‌شنبه',
  wednesday: 'چهارشنبه',
  thursday: 'پنج‌شنبه',
  friday: 'جمعه',
  all: 'تمام روزهای هفته (روزانه)',
};

const DAY_EN_MAP: Record<string, any> = {
  'شنبه': 'saturday',
  'یکشنبه': 'sunday',
  'دوشنبه': 'monday',
  'سه شنبه': 'tuesday',
  'سه‌شنبه': 'tuesday',
  'چهارشنبه': 'wednesday',
  'پنج شنبه': 'thursday',
  'پنج‌شنبه': 'thursday',
  'جمعه': 'friday',
  'همه': 'all',
  'همه روزها': 'all',
  'روزانه': 'all',
  'هر روز': 'all',
};

const SHIFT_FA_MAP: Record<string, string> = {
  morning: 'شیفت صبح (۰۷:۳۰ الی ۱۵:۳۰)',
  evening: 'شیفت عصر (۱۵:۰۰ الی ۲۳:۰۰)',
  night: 'شیفت شب (۲۲:۰۰ الی ۰۷:۳۰)',
  full_day: 'شیفت ۲۴ ساعته / روزانه',
};

const SHIFT_EN_MAP: Record<string, any> = {
  'صبح': 'morning',
  'شیفت صبح': 'morning',
  'عصر': 'evening',
  'شیفت عصر': 'evening',
  'شب': 'night',
  'شیفت شب': 'night',
  '۲۴ ساعته': 'full_day',
  'روزانه': 'full_day',
  'کامل': 'full_day',
};

// خروجی اکسل جدول شیفت‌بندی سرپرستان
export function exportShiftScheduleToExcel(schedules: any[]) {
  const data = schedules.map((s, idx) => ({
    'ردیف': idx + 1,
    'نام و نام خانوادگی سرپرست': s.supervisorName,
    'سرای دانشجویی': s.dormName,
    'روز هفته': DAY_FA_MAP[s.dayOfWeek] || s.dayOfWeek,
    'نوبت شیفت': SHIFT_FA_MAP[s.shiftType] || s.shiftType,
    'ساعت شروع': s.startTime || '-',
    'ساعت پایان': s.endTime || '-',
    'نوع حضور': s.isEveryDay ? 'حضور روزانه (هر روز)' : 'شیفت معین',
    'توضیحات و دستورکار': s.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'شیفت‌بندی سرپرستان');
  XLSX.writeFile(wb, `برنامه_شیفت_بندی_سرپرستان_سراها_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// دانلود فایل نمونه و قالب خام اکسل شیفت‌بندی جهت بارگذاری توسط مدیر
export function exportShiftTemplateToExcel() {
  const templateRows = [
    {
      'نام و نام خانوادگی سرپرست': 'استاد علی قربانی',
      'سرای دانشجویی': 'سرای شهید باهنر (بلوک سینا)',
      'روز هفته': 'شنبه',
      'نوبت شیفت': 'عصر',
      'ساعت شروع': '۱۵:۰۰',
      'ساعت پایان': '۲۳:۰۰',
      'توضیحات': 'نظارت بر ساعت استراحت و سالن مطالعه',
    },
    {
      'نام و نام خانوادگی سرپرست': 'استاد جواد احمدی',
      'سرای دانشجویی': 'سرای شهید باهنر (بلوک فارابی)',
      'روز هفته': 'یکشنبه',
      'نوبت شیفت': 'شب',
      'ساعت شروع': '۲۲:۰۰',
      'ساعت پایان': '۰۷:۳۰',
      'توضیحات': 'حضور و غیاب الکترونیکی شبانه رأس ۲۲:۳۰',
    },
    {
      'نام و نام خانوادگی سرپرست': 'سرکار خانم سمیه کریمی',
      'سرای دانشجویی': 'سرای پردیس فاطمه‌الزهرا (س)',
      'روز هفته': 'همه روزها',
      'نوبت شیفت': 'روزانه',
      'ساعت شروع': '۰۸:۰۰',
      'ساعت پایان': '۲۰:۰۰',
      'توضیحات': 'حضور روزانه و نظارت پیوسته',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'قالب شیفت‌بندی');
  XLSX.writeFile(wb, `قالب_اکسل_شیفت_بندی_سرپرستان.xlsx`);
}

// ورود و خواندن فایل اکسل شیفت‌بندی توسط مدیر
export async function importShiftScheduleFromExcel(
  file: File,
  supervisors: any[],
  dorms: any[]
): Promise<{ success: boolean; count: number; message: string; schedules: any[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
          resolve({ success: false, count: 0, message: 'فایل اکسل خالی است یا ساختار نامعتبری دارد.', schedules: [] });
          return;
        }

        const newSchedules: any[] = [];

        rows.forEach((row, i) => {
          const supName = String(row['نام و نام خانوادگی سرپرست'] || row['نام سرپرست'] || row['سرپرست'] || '').trim();
          const dormName = String(row['سرای دانشجویی'] || row['نام سرا'] || row['سرا'] || row['خوابگاه'] || '').trim();
          const dayFa = String(row['روز هفته'] || row['روز'] || 'all').trim();
          const shiftFa = String(row['نوبت شیفت'] || row['شیفت'] || 'full_day').trim();
          const startTime = String(row['ساعت شروع'] || '').trim();
          const endTime = String(row['ساعت پایان'] || '').trim();
          const notes = String(row['توضیحات'] || row['توضیحات و دستورکار'] || '').trim();

          // جستجوی سرپرست
          const matchedSup = supervisors.find((s) => s.fullName.includes(supName) || supName.includes(s.fullName)) || supervisors[0];
          // جستجوی سرا
          const matchedDorm = dorms.find((d) => d.name.includes(dormName) || dormName.includes(d.name)) || dorms[0];

          const dayOfWeek = DAY_EN_MAP[dayFa] || 'all';
          const shiftType = SHIFT_EN_MAP[shiftFa] || 'full_day';
          const isEveryDay = dayOfWeek === 'all';

          if (matchedSup) {
            newSchedules.push({
              id: `sched_import_${Date.now()}_${i}`,
              supervisorId: matchedSup.id,
              supervisorName: matchedSup.fullName,
              dormId: matchedDorm?.id || 'all',
              dormName: matchedDorm?.name || 'سراهای دانشجویی',
              dayOfWeek,
              shiftType,
              startTime: startTime || (shiftType === 'morning' ? '۰۷:۳۰' : shiftType === 'evening' ? '۱۵:۰۰' : '۲۲:۰۰'),
              endTime: endTime || (shiftType === 'morning' ? '۱۵:۳۰' : shiftType === 'evening' ? '۲۳:۰۰' : '۰۷:۳۰'),
              notes,
              isEveryDay,
            });
          }
        });

        resolve({
          success: true,
          count: newSchedules.length,
          message: `تعداد ${newSchedules.length} شیفت کاری با موفقیت از اکسل بارگذاری و جایگزین گردید.`,
          schedules: newSchedules,
        });
      } catch (err) {
        console.error('Error parsing shift excel', err);
        resolve({ success: false, count: 0, message: 'خطا در پردازش فایل اکسل. لطفاً از قالب معتبر استفاده نمایید.', schedules: [] });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// خروجی اکسل گزارش‌های ثبت‌شده شیفت و وقایع سرپرستان
export function exportShiftReportsToExcel(reports: any[]) {
  const data = reports.map((r, idx) => ({
    'ردیف': idx + 1,
    'کد گزارش': r.reportCode,
    'سرپرست ثبت‌کننده': r.supervisorName,
    'سرای دانشجویی': r.dormName,
    'تاریخ شیفت': r.shiftDate,
    'نوع شیفت': SHIFT_FA_MAP[r.shiftType] || r.shiftType,
    'ساعت حضور': r.shiftTime || '-',
    'تعداد حضور دانشجویان': r.presentStudentCount || '-',
    'خلاصه بازرسی اتاق‌ها و سرا': r.inspectionsSummary || '',
    'حوادث و موارد انضباطی': r.incidentsSummary || 'مورد خاصی گزارش نشد',
    'نکات تحویل به سرپرست شیفت بعد': r.handoverNotes || '',
    'زمان ثبت سیستمی': r.createdAt,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'دفتر وقایع و شیفت‌ها');
  XLSX.writeFile(wb, `گزارش_جامع_شیفت_های_سرپرستی_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// =============================================================
// توابع اکسل شیفت‌بندی و گزارش‌های مشاوران (Counselor Excel Utils)
// =============================================================

// خروجی اکسل جدول شیفت‌های کاری مشاوران
export function exportCounselorShiftScheduleToExcel(schedules: any[]) {
  const data = schedules.map((s, idx) => ({
    'ردیف': idx + 1,
    'نام و نام خانوادگی مشاور': s.counselorName,
    'مرکز مشاوره / سرای مستقر': s.dormName || 'مرکز مشاوره مرکزی',
    'روز هفته': DAY_FA_MAP[s.dayOfWeek] || s.dayOfWeek,
    'ساعت شروع شیفت': s.startTime,
    'ساعت پایان شیفت': s.endTime,
    'اتاق / محل استقرار': s.roomNumber || 'دفتر مشاوره',
    'توضیحات و زمینه تخصصی': s.notes || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'برنامه شیفت مشاوران');
  XLSX.writeFile(wb, `برنامه_شیفت_مشاوران_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// دانلود فایل نمونه خام (Template) برای بارگذاری شیفت‌های مشاوران
export function exportCounselorShiftTemplateToExcel() {
  const templateRows = [
    {
      'نام و نام خانوادگی مشاور': 'دکتر سارا محمودی',
      'روز هفته': 'شنبه',
      'ساعت شروع': '۱۴:۰۰',
      'ساعت پایان': '۱۸:۰۰',
      'اتاق / محل استقرار': 'دفتر مشاوره سرای باهنر',
      'توضیحات': 'مشاوره تحصیلی و سازگاری با خوابگاه',
    },
    {
      'نام و نام خانوادگی مشاور': 'دکتر علیرضا نادری',
      'روز هفته': 'یکشنبه',
      'ساعت شروع': '۱۶:۰۰',
      'ساعت پایان': '۲۰:۰۰',
      'اتاق / محل استقرار': 'دفتر مشاوره و روانشناسی مرکزی',
      'توضیحات': 'مدیریت استرس، اضطراب و روابط بین‌فردی',
    },
    {
      'نام و نام خانوادگی مشاور': 'دکتر سارا محمودی',
      'روز هفته': 'سه‌شنبه',
      'ساعت شروع': '۰۹:۰۰',
      'ساعت پایان': '۱۳:۰۰',
      'اتاق / محل استقرار': 'مرکز بهداشت و روان پردیس',
      'توضیحات': 'کارگاه و جلسات مشاوره فردی',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'قالب شیفت مشاوران');
  XLSX.writeFile(wb, `قالب_اکسل_شیفت_بندی_مشاوران.xlsx`);
}

// ورود و پردازش فایل اکسل شیفت‌های مشاوران
export async function importCounselorShiftScheduleFromExcel(
  file: File,
  counselors: any[],
  dorms: any[]
): Promise<{ success: boolean; count: number; message: string; schedules: any[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
          resolve({ success: false, count: 0, message: 'فایل اکسل خالی است یا ساختار نامعتبری دارد.', schedules: [] });
          return;
        }

        const newSchedules: any[] = [];

        rows.forEach((row, i) => {
          const cnsName = String(row['نام و نام خانوادگی مشاور'] || row['نام مشاور'] || row['مشاور'] || '').trim();
          const dormName = String(row['مرکز مشاوره / سرای مستقر'] || row['نام سرا'] || row['سرا'] || '').trim();
          const dayFa = String(row['روز هفته'] || row['روز'] || 'all').trim();
          const startTime = String(row['ساعت شروع'] || '۱۴:۰۰').trim();
          const endTime = String(row['ساعت پایان'] || '۱۸:۰۰').trim();
          const roomNumber = String(row['اتاق / محل استقرار'] || row['اتاق'] || 'دفتر مشاوره').trim();
          const notes = String(row['توضیحات'] || row['زمینه تخصصی'] || '').trim();

          const matchedCns = counselors.find((c) => c.fullName.includes(cnsName) || cnsName.includes(c.fullName)) || counselors[0];
          const matchedDorm = dorms.find((d) => d.name.includes(dormName) || dormName.includes(d.name)) || dorms[0];

          const dayOfWeek = DAY_EN_MAP[dayFa] || 'all';

          if (matchedCns) {
            newSchedules.push({
              id: `cshift_imp_${Date.now()}_${i}`,
              counselorId: matchedCns.id,
              counselorName: matchedCns.fullName,
              dormId: matchedDorm?.id || 'all',
              dormName: matchedDorm?.name || 'مرکز مشاوره دانشگاه',
              dayOfWeek,
              startTime: startTime || '۱۴:۰۰',
              endTime: endTime || '۱۸:۰۰',
              roomNumber: roomNumber || 'دفتر مشاوره',
              notes: notes || 'جلسات مشاوره فردی و روانشناختی',
            });
          }
        });

        resolve({
          success: true,
          count: newSchedules.length,
          message: `تعداد ${newSchedules.length} شیفت مشاوران با موفقیت از فایل اکسل استخراج و اضافه گردید.`,
          schedules: newSchedules,
        });
      } catch (err) {
        console.error('Error importing counselor shifts from excel', err);
        resolve({ success: false, count: 0, message: 'خطا در پردازش فایل اکسل شیفت مشاوران.', schedules: [] });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// خروجی اکسل گزارش‌های فعالیت مشاوران
export function exportCounselorReportsToExcel(reports: any[]) {
  const data = reports.map((r, idx) => ({
    'ردیف': idx + 1,
    'کد گزارش': r.reportCode,
    'نام مشاور': r.counselorName,
    'تاریخ شیفت': r.shiftDate,
    'ساعت حضور در شیفت': r.shiftTimeWindow || '-',
    'تعداد مراجعین دانشجو': r.totalSessionsCount,
    'تعداد موارد اضطراری / ارجاع فوری': r.urgentCasesCount || 0,
    'انواع موضوعات و حوزه‌های مشاوره': (r.caseCategories || []).join('، '),
    'اقدامات و مداخله‌های انجام‌شده': r.interventionsSummary || '-',
    'توصیه‌ها و پیشنهادات به اداره سراها': r.recommendationsToAdmin || '-',
    'زمان ثبت سیستمی': r.createdAt,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'گزارش‌های مشاوره');
  XLSX.writeFile(wb, `گزارش_جامع_فعالیت_مشاوران_${new Date().toISOString().slice(0, 10)}.xlsx`);
}



