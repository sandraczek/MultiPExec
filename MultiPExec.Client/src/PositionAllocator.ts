export class PositionAllocator {
    private static STEP = 100000;

    public static allocateBetween(left: number[] | null, right: number[] | null): number[] {
        const leftPath = left || [];
        const rightPath = right || [];
        const newPath: number[] = [];
        let depth = 0;

        while (true) {
            const l = depth < leftPath.length ? leftPath[depth] : 0;
            let r: number;

            if (depth < rightPath.length) {
                r = rightPath[depth];
            } else {
                r = this.STEP;
            }

            if (depth < leftPath.length && depth < rightPath.length && l > r) {
                throw new Error("Krytyczny błąd: Lewy węzeł jest większy od prawego.");
            }

            if (!right) {
                newPath.push(l + this.STEP);
                return newPath;
            }

            if (l === r) {
                newPath.push(l);
                depth++;
                continue;
            }

            if (r - l > 1) {
                newPath.push(Math.floor(l + (r - l) / 2));
                return newPath;
            }

            newPath.push(l);
            depth++;
        }
    }
}