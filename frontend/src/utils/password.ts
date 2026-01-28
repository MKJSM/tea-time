export interface PasswordChecks {
    length: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
}

export interface PasswordStrength {
    score: number;
    checks: PasswordChecks;
}

export const checkStrength = (pass: string): PasswordStrength => {
    let score = 0;
    const checks = {
        length: pass.length >= 8,
        hasUpper: /[A-Z]/.test(pass),
        hasLower: /[a-z]/.test(pass),
        hasNumber: /\d/.test(pass),
    };

    if (checks.length) score++;
    if (checks.hasUpper) score++;
    if (checks.hasLower) score++;
    if (checks.hasNumber) score++;

    return { score, checks };
};

export const getStrengthColor = (s: number): string => {
    if (s <= 2) return 'bg-red-500';
    if (s === 3) return 'bg-yellow-500';
    return 'bg-green-500';
};

export const getStrengthLabel = (s: number): string => {
    if (s === 0) return '';
    if (s <= 2) return 'Weak';
    if (s === 3) return 'Medium';
    return 'Strong';
};
