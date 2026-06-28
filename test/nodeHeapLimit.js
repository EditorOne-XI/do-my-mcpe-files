import v8 from 'node:v8';

const { heap_size_limit } = v8.getHeapStatistics();
const heapSizeInGB = heap_size_limit / (1024 * 1024 * 1024);

console.log(`${heapSizeInGB} GB`);
