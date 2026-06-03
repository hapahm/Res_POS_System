import { useDispatch } from "react-redux";
import { getUserData } from "../https";
import { useEffect, useState } from "react";
import { removeUser, setUser } from "../redux/slices/customerUserSlice";

const useLoadData = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await getUserData();
        console.log(data);
        const { _id, name, email, phone, role, accountStatus } = data.data;
        dispatch(setUser({ _id, name, email, phone, role, accountStatus }));
      } catch (error) {
        dispatch(removeUser());
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [dispatch]);

  return isLoading;
};

export default useLoadData;
