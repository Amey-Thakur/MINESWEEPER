/*
 * QuadTree.js
 *
 * Author       : Amey Thakur
 * GitHub       : https://github.com/Amey-Thakur
 * Repository   : https://github.com/Amey-Thakur/MINESWEEPER
 * Release Date : March 5, 2026
 * License      : MIT
 *
 * Tech Stack   : Vanilla JavaScript (ES6)
 *
 * Description  : Implements a recursive spatial partitioning tree structure.
 *                This architecture enables logarithmic time complexity queries
 *                against two-dimensional cartesian coordinate bounds, allowing 
 *                the rendering pipeline to efficiently cull off-screen geometry.
 */


// Defines an axis-aligned bounding box utilized for both node boundaries 
// and absolute viewport query perimeters.

export class Rectangle {

    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.w = width;
        this.h = height;
    }

    // Validates inclusive geometric inclusion of a specific coordinate vector.
    contains(px, py) {
        return (
            px >= this.x &&
            px < this.x + this.w &&
            py >= this.y &&
            py < this.y + this.h
        );
    }

    // Validates if two independent geometric bounds share overlapping area.
    intersects(range) {
        return !(
            range.x >= this.x + this.w ||
            range.x + range.w <= this.x ||
            range.y >= this.y + this.h ||
            range.y + range.h <= this.y
        );
    }
}


// Recursive spatial partition implementation used to subdivide a two-dimensional 
// coordinate plane into four navigable quadrants. This data structure facilitates 
// efficient spatial indexing by reducing the search space from O(N) to O(log N).
//
// Quadrant Topology:
//   NW | NE
//   -------
//   SW | SE
//
// Computational Complexity:
//   - Insertion : O(log N) average; ensures contiguous point distribution.
//   - Querying  : O(log N + k) where k represents the local result set density.
//   - Clearing  : O(1) by severing the root reference for GC reclamation.

export class QuadTree {

    constructor(boundary, capacity = 4) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;

        // Child pointers instantiated upon threshold breach
        this.nw = null;
        this.ne = null;
        this.sw = null;
        this.se = null;
    }


    // Injects a coordinate target into the appropriate geometric node wrapper.
    // Will dynamically shift capacity recursively if the node threshold overflows.
    insert(point) {
        if (!this.boundary.contains(point.x, point.y)) {
            return false;
        }

        if (this.points.length < this.capacity && !this.divided) {
            this.points.push(point);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        return (
            this.nw.insert(point) ||
            this.ne.insert(point) ||
            this.sw.insert(point) ||
            this.se.insert(point)
        );
    }


    // Generates four discrete recursive boundary objects distributing geometry 
    // constraints uniformly across the active area.

    subdivide() {
        const { x, y, w, h } = this.boundary;
        const hw = w / 2;
        const hh = h / 2;

        this.nw = new QuadTree(new Rectangle(x, y, hw, hh), this.capacity);
        this.ne = new QuadTree(new Rectangle(x + hw, y, hw, hh), this.capacity);
        this.sw = new QuadTree(new Rectangle(x, y + hh, hw, hh), this.capacity);
        this.se = new QuadTree(new Rectangle(x + hw, y + hh, hw, hh), this.capacity);

        // Reallocate locally retained nodes into updated boundary structures
        for (const p of this.points) {
            this.nw.insert(p) ||
                this.ne.insert(p) ||
                this.sw.insert(p) ||
                this.se.insert(p);
        }

        this.points = [];
        this.divided = true;
    }


    // Recursively retrieves arrays of valid coordinates bounded strictly within 
    // the requested geometric parameter bounds. Primarily utilized for offscreen culling.

    query(range, found = []) {
        if (!this.boundary.intersects(range)) {
            return found;
        }

        for (const p of this.points) {
            if (range.contains(p.x, p.y)) {
                found.push(p);
            }
        }

        if (this.divided) {
            this.nw.query(range, found);
            this.ne.query(range, found);
            this.sw.query(range, found);
            this.se.query(range, found);
        }

        return found;
    }


    // Destroys references forcing the garbage collector to purge the nested tree structure.

    clear() {
        this.points = [];
        this.divided = false;
        this.nw = null;
        this.ne = null;
        this.sw = null;
        this.se = null;
    }


    // Performs an exhaustive count query across the nested logical structure.

    size() {
        let count = this.points.length;

        if (this.divided) {
            count += this.nw.size();
            count += this.ne.size();
            count += this.sw.size();
            count += this.se.size();
        }

        return count;
    }
}
