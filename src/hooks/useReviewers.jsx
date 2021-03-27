import { useEffect, useRef, useState } from 'react';
import { UserService } from '../services';

const useReviewers = () => {
  const [reviewers, setReviewers] = useState([]);
  const isMounted = useRef();

  useEffect(async () => {
    isMounted.current = true;
    const res = await UserService.getReviewers();

    if (res && isMounted.current) setReviewers(res.data);

    return () => {
      isMounted.current = false;
    };
  }, []);

  return reviewers;
};

export default useReviewers;
