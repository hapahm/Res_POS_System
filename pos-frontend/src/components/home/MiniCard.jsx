import React from 'react'

/**
 * MiniCard
 * Component hiển thị thẻ thống kê nhỏ:
 * - Tiêu đề (title)
 * - Icon minh họa
 * - Giá trị chính (number)
 * - Phần trăm tăng/giảm so với hôm qua (footerNum)
 */
const MiniCard = ({ title, icon, number, footerNum }) => {
  return (
    <div className='bg-[#1a1a1a] py-5 px-5 rounded-lg w-[50%]'>

      {/* Header của thẻ: tiêu đề + icon */}
      <div className='flex items-start justify-between'>
        <h1 className='text-[#f5f5f5] text-lg font-semibold tracking-wide'>
          {title}
        </h1>

        {/* 
          Đổi màu icon dựa theo loại thẻ:
          - Nếu là "Total Earnings" => màu xanh (doanh thu)
          - Ngược lại => màu vàng (trạng thái khác)
          ⚠️ Không đổi chuỗi "Total Earnings" để tránh ảnh hưởng logic
        */}
        <button
          className={`${title === "Total Earnings" ? "bg-[#02ca3a]" : "bg-[#f6b100]"
            } p-3 rounded-lg text-[#f5f5f5] text-2xl`}
        >
          {icon}
        </button>
      </div>

      {/* Nội dung chính */}
      <div>

        {/* 
          Hiển thị số liệu:
          - Nếu là doanh thu thì thêm ký hiệu tiền tệ ₫
          - Nếu không thì hiển thị số bình thường
        */}
        <h1 className='text-[#f5f5f5] text-4xl font-bold mt-5'>
          {title === "Total Earnings" ? `₫${number}` : number}
        </h1>

        {/* Phần so sánh với hôm qua */}
        <h1 className='text-[#f5f5f5] text-lg mt-2'>
          <span className='text-[#02ca3a]'>{footerNum}%</span> so với hôm qua
        </h1>

      </div>
    </div>
  )
}

export default MiniCard
