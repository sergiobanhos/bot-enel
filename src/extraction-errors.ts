export const NO_CUSTOMER_REGISTRATION_MESSAGE = 'Sem cadastro na concessionaria';
export const VERIFICATION_CODE_TIMEOUT_MESSAGE = 'Código de verificação expirado ou não recebido a tempo';

export enum ExtractionFlowErrorCode {
    NO_CUSTOMER_REGISTRATION = 'NO_CUSTOMER_REGISTRATION',
    VERIFICATION_CODE_TIMEOUT = 'VERIFICATION_CODE_TIMEOUT',
}

export class ExtractionFlowError extends Error {
    code: ExtractionFlowErrorCode;

    constructor(code: ExtractionFlowErrorCode, message: string) {
        super(message);
        this.name = 'ExtractionFlowError';
        this.code = code;
    }
}

export function createNoCustomerRegistrationError(): ExtractionFlowError {
    return new ExtractionFlowError(
        ExtractionFlowErrorCode.NO_CUSTOMER_REGISTRATION,
        NO_CUSTOMER_REGISTRATION_MESSAGE
    );
}

export function createVerificationCodeTimeoutError(): ExtractionFlowError {
    return new ExtractionFlowError(
        ExtractionFlowErrorCode.VERIFICATION_CODE_TIMEOUT,
        VERIFICATION_CODE_TIMEOUT_MESSAGE
    );
}

export function isExtractionFlowError(
    error: unknown,
    code?: ExtractionFlowErrorCode
): error is ExtractionFlowError {
    return error instanceof ExtractionFlowError && (code ? error.code === code : true);
}

export function assertVerificationMethodsAvailable(methods: {
    phoneAvailable: boolean;
    emailAvailable: boolean;
}): void {
    if (!methods.phoneAvailable && !methods.emailAvailable) {
        throw createNoCustomerRegistrationError();
    }
}

export function assertVerificationCodeReceived(verificationCode: string | null): string {
    if (!verificationCode) {
        throw createVerificationCodeTimeoutError();
    }

    return verificationCode;
}

export function toPublicExtractionError(error: unknown): Error {
    if (error instanceof Error) {
        return error;
    }

    return new Error('Unknown error');
}
