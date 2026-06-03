import React from 'react'

/**
 * MiniCard
 * Component hiển thị thẻ thống kê nhỏ:
 * - Tiêu đề (title)
 * - Icon minh họa
 * - Giá trị chính (number)
 * - Phần trăm tăng/giảm so với hôm qua (footerNum)
 */
const MiniCard = ({ title, icon, value, percent, isPositive = true, iconVariant = "warning" }) => {
  const percentText = Number.isFinite(Number(percent))
    ? `${Number(percent) > 0 ? "+" : ""}${Number(percent).toFixed(1)}%`
    : "0.0%";

  const iconClass = iconVariant === "success" ? "bg-[#02ca3a]" : "bg-[#f6b100]";
  const percentClass = isPositive ? "text-[#02ca3a]" : "text-[#ff6b6b]";

  return (
    <div className='bg-[#1a1a1a] py-5 px-5 rounded-lg w-[50%]'>

      {/* Header của thẻ: tiêu đề + icon */}
      <div className='flex items-start justify-between'>
        <h1 className='text-[#f5f5f5] text-lg font-semibold tracking-wide'>
          {title}
        </h1>

        <button
          className={`${iconClass} p-3 rounded-lg text-[#f5f5f5] text-2xl`}
        >
          {icon}
        </button>
      </div>

      {/* Nội dung chính */}
      <div>

        <h1 className='text-[#f5f5f5] text-4xl font-bold mt-5'>
          {value}
        </h1>

        {/* Phần so sánh với hôm qua */}
        <h1 className='text-[#f5f5f5] text-lg mt-2'>
          <span className={percentClass}>{percentText}</span> so với hôm qua
        </h1>

      </div>
    </div>
  )
}

export default MiniCard
