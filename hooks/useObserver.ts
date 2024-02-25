import { updateViews } from "@/lib/articles";
import { MutableRefObject, useEffect, useRef, useState } from "react";

/**
 * Custom hook to observe the intersection of a given DOM element with its closest
 * scrollable ancestor or the viewport. This is used to determine when the element
 * is viewed by the user and increment the view counter separately from the visits
 * counter on the entire page.
 * @param {MutableRefObject<HTMLElement | null>} ref - Reference to the DOM element
 * to observe.
 * @returns {boolean} - Indicates whether the observed element is intersecting
 * with the viewport or its scrollable ancestor.
 */
export const useObserver = (ref: MutableRefObject<HTMLElement | null>, source: string): boolean => {
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
  const intersected = useRef(false);

  useEffect(() => {
    const current = ref?.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && intersected.current === false) {
          intersected.current = true;
          updateViews(source);
        }
      },
      { rootMargin: '0px' }
    );
    current && observer?.observe(current);

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [ref, source]);

  return isIntersecting;
};