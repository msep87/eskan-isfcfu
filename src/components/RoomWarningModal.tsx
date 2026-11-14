import React, { useState, useEffect } from 'react';
import { Dormitory, Room, RoomWarning } from '../types';
import { Storage } from '../utils/storage';
import { ShieldAlert, AlertTriangle, X, Check } from 'lucide-react';

interface RoomWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  dorms: Dormitory[];
  rooms: Room[];
  supervisorName: string;
  onWarningAdded: () => void;
}

export const RoomWarningModal: React.FC<RoomWarningModalProps> = ({
  isOpen,
  onClose,
  dorms,
  rooms,
  supervisorName,
  onWarningAdded,
}) => {
  const [selectedDormId, setSelectedDormId] = useState(dorms[0]?.id || '');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  useEffect(() => {
    if (dorms.length > 0 && (!selectedDormId || !dorms.some((d) => d.id === selectedDormId))) {
      setSelectedDormId(dorms[0].id);
    }
  }, [dorms, selectedDormId]);
  const [title, setTitle] = useState('تذکر رعایت نظم و نظافت اتاق');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('warning');

  if (!isOpen) return null;

  const dormRooms = rooms.filter((r) => r.dormId === selectedDormId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !title.trim() || !description.trim()) {
      alert('لطفاً کلیه فیلدها شامل اتاق، عنوان و متن اخطار را تکمیل فرمایید.');
      return;
    }

    Storage.addRoomWarning({
      dormId: selectedDormId,
      roomId: selectedRoomId,
      title: title.trim(),
      description: description.trim(),
      severity,
      date: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      supervisorName,
      resolved: false,
    });

    onWarningAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              اعلام اخطار و تذکر انضباطی به اتاق
            </h3>
            <p className="text-xs text-slate-500">
              این اخطار به طور مستقیم در داشبورد تمام دانشجویان ساکن در این اتاق نمایش داده خواهد شد.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                انتخاب سرا
              </label>
              <select
                value={selectedDormId}
                onChange={(e) => {
                  setSelectedDormId(e.target.value);
                  setSelectedRoomId('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
              >
                {dorms.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                شماره اتاق *
              </label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
                required
              >
                <option value="">-- انتخاب اتاق --</option>
                {dormRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    اتاق {r.roomNumber} (طبقه {r.floor})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              سطح اخطار
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSeverity('info')}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition ${
                  severity === 'info'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                تذکر عادی
              </button>
              <button
                type="button"
                onClick={() => setSeverity('warning')}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition ${
                  severity === 'warning'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                اخطار انضباطی
              </button>
              <button
                type="button"
                onClick={() => setSeverity('critical')}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition ${
                  severity === 'critical'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
              >
                اخطار کتبی و فوری
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              عنوان تذکر
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً تذکر نظافت اتاق و آشپزخانه یا عدم رعایت سکوت"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              متن کامل توضیحات اخطار
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="شرح تخلف، موارد مشاهده شده و مهلت رفع آن..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>ثبت و ابلاغ اخطار به اتاق</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
