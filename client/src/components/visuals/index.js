// Registry for ```visual <name> blocks in the articles.
// ArticleRenderer looks the name up here; unknown names get a friendly
// "Visualization coming soon" fallback card instead of crashing.
import EventLoop from './EventLoop';
import TwoPointers from './TwoPointers';
import SlidingWindow from './SlidingWindow';
import BinarySearch from './BinarySearch';
import Sorting from './Sorting';
import RecursionTree from './RecursionTree';
import Flexbox from './Flexbox';
import RenderCounter from './RenderCounter';

export default {
  'event-loop': EventLoop,
  'two-pointers': TwoPointers,
  'sliding-window': SlidingWindow,
  'binary-search': BinarySearch,
  sorting: Sorting,
  'recursion-tree': RecursionTree,
  flexbox: Flexbox,
  'render-counter': RenderCounter,
};
