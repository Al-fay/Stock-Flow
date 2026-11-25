export interface SharedPropsUser {
    [key: string]: unknown;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            email_verified_at: string | null;
            created_at?: string;
        } | null;
    };
}
