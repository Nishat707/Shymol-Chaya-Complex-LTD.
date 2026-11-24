"use client";
export function PrintButton() { return <button className="noprint" onClick={() => window.print()}>Print receipt</button>; }
