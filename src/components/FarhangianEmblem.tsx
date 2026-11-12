import React from 'react';

interface FarhangianEmblemProps {
  className?: string;
  size?: number;
  showText?: boolean;
  customLogoUrl?: string;
}

export const FarhangianEmblem: React.FC<FarhangianEmblemProps> = ({
  className = '',
  size = 64,
  customLogoUrl,
}) => {
  // بر اساس درخواست: تا زمانی که آرم توسط مدیر بارگذاری نشده است هیچ آرمی نباید نمایش داده شود
  if (!customLogoUrl) {
    return null;
  }

  return (
    <div
      className={`inline-flex flex-col items-center justify-center shrink-0 ${className}`}
      style={{ width: size }}
      title="آرم دانشگاه فرهنگیان"
    >
      <img
        src={customLogoUrl}
        alt="آرم دانشگاه فرهنگیان"
        className="w-full h-auto max-h-full object-contain drop-shadow-sm select-none"
        style={{ maxHeight: size * 1.3 }}
      />
    </div>
  );
};
