export function validateNumber(value: string, min: number, max: number): boolean {
    if (value === '') {
        return false;
    }
    const number = Number(value);
    return !isNaN(number) && number >= min && number <= max;
}
