import React from "react";

const CustomerFullScreenLoader = () => {
    return (
        <div className="fullscreen-loader" role="status" aria-live="polite" aria-label="Đang tải dữ liệu">
            <div className="spinner"></div>
        </div>
    );
};

export default CustomerFullScreenLoader;