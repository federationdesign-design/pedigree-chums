// The basket mark used in the Nav's top row, where Pre-order is an icon rather than
// a label. Supplied by Steve as basket-icon.svg, 20 September 2026; the artwork's own
// viewBox is kept so nothing is cropped.
//
// NOTE THE BOX IS NOT SQUARE, 720 x 590.1, unlike the cookie and the social marks.
// .socialIcon sizes by HEIGHT with width auto, which is what you want here: every
// mark in the row sits on the same optical line and the basket simply comes out a
// little wider. Do not force it square; it would squash.
//
// The source painted its one path white through a .st0 class in an embedded <style>.
// That is stripped: fill="currentColor" instead, so it takes the link colour and the
// yellow hover like everything else in the row.
export default function BasketIcon() {
  return (
    <svg viewBox="0 0 720 590.1" fill="currentColor" aria-hidden="true">
      <path d="M204.3,167.7h310.6l-78.9-135.2c-7.3-27.1,26.4-44.2,44.1-22.2l94.4,156.6,123,.9c36.9,10.2,23,56.4-13.8,50.3l-2.3,2.4-47.8,292.5c-9.2,43.2-44.9,70.3-88.1,73.4-121.1-5.3-248.3,7.1-368.7,0-48.6-2.8-85.6-32.4-92.8-81.3L37.8,220.5l-2.3-2.4c-36.6,6.2-50.8-39.9-13.8-50.3l123-.9L239.1,10.4c17.7-22,51.4-4.9,44.1,22.2l-78.9,135.2ZM219.6,285.7c-9.1,1.7-17,10.2-18.3,19.4,3.7,44.8-5.4,99-.2,142.6,3.3,27.2,46.1,29.6,50.1-3.3-2.4-42.5,3.8-89.7.2-131.6-1.6-18.5-12.3-30.7-31.9-27ZM352.9,285.7c-8.4,1.7-17.4,12.3-18.3,20.9,3.2,44.3-4.8,96-.1,139.4,3.1,29.2,45.1,30.6,50.1,1.4-3.2-44.3,4.8-96,.1-139.4-1.7-16-16.1-25.6-31.8-22.4ZM486.2,285.7c-10.5,2.2-17,14.1-18.2,24.1-4.9,40.7,3.4,90-.2,131.6,1,31,40.6,38.2,50.1,7.7-3.6-45.1,5.1-98.5.1-142.6-1.8-16.1-16.6-24-31.8-20.8Z" />
    </svg>
  );
}
