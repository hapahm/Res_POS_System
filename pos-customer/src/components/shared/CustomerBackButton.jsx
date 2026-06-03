import React from "react";
import { IoArrowBackOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

const CustomerBackButton = () => {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full bg-blue-600 p-2 text-xl font-bold text-white"
            aria-label="Quay lại"
        >
            <IoArrowBackOutline />
        </button>
    );
};

export default CustomerBackButton;