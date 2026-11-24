// All business dates use Asia/Dhaka.
const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit" });
export const monthOf = (d: Date) => fmt.format(d).slice(0, 7); // "YYYY-MM"
// A date column reads as "YYYY-MM-DD" text; its month is the prefix.
export const monthOfDate = (d: string) => d.slice(0, 7);
export const taka = (n: { toString(): string } | number) => "৳" + Number(n.toString()).toLocaleString("en-US");
