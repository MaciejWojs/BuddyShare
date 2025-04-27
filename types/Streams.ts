export interface Stream {
    streamer_id: number;
    options_id: number;
    stream_description: string;
    title: string;
    thumbnail: string | null;
    isDeleted: boolean;
    isLive: boolean;
    path: string | null;
    isPublic: boolean;
    category_name: string | null;
    id: number;
    username: string;
    profile_picture: string;
    description: string;
    isBanned: boolean;
    created_at: string;
    updated_at: string;
    userRole: string;
    tags: any | null;
    stream_urls: {
        name: string;
        dash: string;
    }[];
}