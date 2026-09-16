export interface IPasswordService{

     generateHash(password:string): Promise<string>
     verifyPasswordHash(password:string, passwordHash: string): Promise<boolean>

}
