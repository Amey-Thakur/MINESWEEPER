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
 * Description  : QuadTree implementation for spatial indexing of cells
 *                on the Minesweeper board. Allows O(log N + k) rectangle
 *                queries instead of O(N) iteration, where N is the total
 *                cell count and k is the number of results. This makes
 *                viewport culling practical on boards with up to 1,000,000
 *                cells.
 */


// -------------------------------------------------------
// Rectangle (axis-aligned bounding box)
//
// Used both as the boundary of each QuadTree node and as
// the query region when searching for visible cells.
// -------------------------------------------------------

export class Rectangle {

    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.w = width;
        this.h = height;
    }

    // Check if a point (px, py) falls inside this rectangle.
    contains(px, py) {
        return (
            px >= this.x &&
            px < this.x + this.w &&
            py >= this.y &&
            py < this.y + this.h
        );
    }

    // Check if another rectangle overlaps with this one.
    // Two rectangles overlap when neither is fully to the
    // left, right, above, or below the other.
    intersects(range) {
        return !(
            range.x >= this.x + this.w ||
            range.x + range.w <= this.x ||
            range.y >= this.y + this.h ||
            range.y + range.h <= this.y
        );
    }
}


// -------------------------------------------------------
// QuadTree
//
// A region-based QuadTree that subdivides space into four
// equal quadrants when a node exceeds its capacity. Each
// leaf stores up to `capacity` points before splitting.
//
// Quadrant layout:
//   NW | NE
//   -------
//   SW | SE
//
// Time complexity:
//   insert:  O(log N) average
//   query:   O(log N + k) where k = number of results
//   clear:   O(1) (just reset the root)
// -------------------------------------------------------

export class QuadTree {

    constructor(boundary, capacity = 4) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;

        // Child nodes (created on first subdivision)
        this.nw = null;
        this.ne = null;
        this.sw = null;
        this.se = null;
    }


    // Insert a point into the tree. Each point is an object
    // with at least { x, y } properties. Additional data
    // (like row, col, cell state) can be attached.
    //
    // Returns true if the point was inserted, false if it
    // falls outside the boundary.

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


    // Split this node into four children and redistribute
    // any existing points among them.

    subdivide() {
        const { x, y, w, h } = this.boundary;
        const hw = w / 2;
        const hh = h / 2;

        this.nw = new QuadTree(new Rectangle(x, y, hw, hh), this.capacity);
        this.ne = new QuadTree(new Rectangle(x + hw, y, hw, hh), this.capacity);
        this.sw = new QuadTree(new Rectangle(x, y + hh, hw, hh), this.capacity);
        this.se = new QuadTree(new Rectangle(x + hw, y + hh, hw, hh), this.capacity);

        // Move existing points down into children
        for (const p of this.points) {
            this.nw.insert(p) ||
                this.ne.insert(p) ||
                this.sw.insert(p) ||
                this.se.insert(p);
        }

        this.points = [];
        this.divided = true;
    }


    // Find all points within a rectangular region.
    //
    // This is the key operation for viewport culling: given
    // the camera's visible area, return only the cells that
    // need to be drawn. On a 1000x1000 board, this returns
    // around 500 cells instead of scanning all 1,000,000.

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


    // Remove all points and collapse all subdivisions.
    // Used when starting a new game.

    clear() {
        this.points = [];
        this.divided = false;
        this.nw = null;
        this.ne = null;
        this.sw = null;
        this.se = null;
    }


    // Count the total number of points stored in the tree.
    // Useful for debugging and validation.

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
