import assert from 'node:assert/strict';
import test from 'node:test';

import {
    ExtractionFlowError,
    ExtractionFlowErrorCode,
    NO_CUSTOMER_REGISTRATION_MESSAGE,
    VERIFICATION_CODE_TIMEOUT_MESSAGE,
    assertVerificationCodeReceived,
    assertVerificationMethodsAvailable,
    toPublicExtractionError,
} from './extraction-errors';

test('classifica ausência de métodos de verificação como sem cadastro', () => {
    assert.throws(
        () => assertVerificationMethodsAvailable({ phoneAvailable: false, emailAvailable: false }),
        (error: unknown) =>
            error instanceof ExtractionFlowError &&
            error.code === ExtractionFlowErrorCode.NO_CUSTOMER_REGISTRATION &&
            error.message === NO_CUSTOMER_REGISTRATION_MESSAGE
    );
});

test('classifica código ausente como timeout de verificação', () => {
    assert.throws(
        () => assertVerificationCodeReceived(null),
        (error: unknown) =>
            error instanceof ExtractionFlowError &&
            error.code === ExtractionFlowErrorCode.VERIFICATION_CODE_TIMEOUT &&
            error.message === VERIFICATION_CODE_TIMEOUT_MESSAGE
    );
});

test('preserva erros genéricos ao normalizar erro público da extração', () => {
    const originalError = new Error('erro inesperado');

    assert.equal(toPublicExtractionError(originalError), originalError);
});
