import type { IPasswordService } from "../interfaces/IPasswordService.js";
import * as argon2 from "argon2";

export class PasswordService implements IPasswordService{

    async generateHash(password: string): Promise<string> {

        const passwordHashed =  argon2.hash(password, {type: argon2.argon2id} );
        return passwordHashed
    }

    async verifyPasswordHash(password: string, passwordHash: string): Promise<boolean> {
        return  argon2.verify(passwordHash, password);

    }
}

export default PasswordService