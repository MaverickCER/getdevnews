type TSkeletonProps = {
  count?: number;
};

/**
 * React component representing the skeleton of an article item. The aim is to
 * reduce layout shifts while also displaying something for the user to look at
 * while the rest of the content is loading. When used in addition to blured
 * placeholders this should provide an experience that feels snappy even if
 * the user is on a slow 3g connection.
 */
export default function Skeleton({ count = 1 }: TSkeletonProps) {
  return Array.from(Array(count).keys()).map((v, i) => (
    <div
      key={i}
      aria-hidden={true}
      className='flex flex-col flex-grow flex-shrink w-1/4 pb-4 rounded min-w max-w'>
      <div className='skeleton-img relative img-wrapper rounded overflow-hidden bg-gray-300' />
      <div className='flex flex-col m-auto p-4 z-10 text-left rounded data'>
        <i className='text-sm skeleton-text'>&nbsp;</i>
        <p className='font-bold skeleton-text'>&nbsp;</p>
        <small className='skeleton-text'>&nbsp;</small>
      </div>
    </div>
  ));
}
