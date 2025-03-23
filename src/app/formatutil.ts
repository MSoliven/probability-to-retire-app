export class FormatUtil {

    static parseToNumber(quantityStr: string): number {
        var num = Number(quantityStr.replace(/[^0-9.-]+/g,""));
        return num;
    }

    static formatNumber(num: number, dec?: number): string {
        var digits = !dec && dec != 0 ? 2 : dec;
        return "$" + num.toLocaleString("en-US", {minimumFractionDigits: digits, maximumFractionDigits: digits});
    }
}