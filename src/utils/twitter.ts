/**
 * Twitter API Utility
 * Fetches pinned tweet from Twitter API v2
 */

interface TwitterUser {
    id: string;
    name: string;
    username: string;
    pinned_tweet_id?: string;
}

interface TwitterTweet {
    id: string;
    text: string;
    created_at?: string;
}

interface TwitterResponse {
    data: TwitterUser;
    includes?: {
        tweets?: TwitterTweet[];
    };
}

export async function getPinnedTweet(username: string = 'aaanilclk'): Promise<string | null> {
    const bearerToken = import.meta.env.TWITTER_BEARER_TOKEN;

    if (!bearerToken) {
        console.warn('Twitter Bearer Token not found in environment variables');
        return null;
    }

    try {
        const response = await fetch(
            `https://api.twitter.com/2/users/by/username/${username}?user.fields=pinned_tweet_id&expansions=pinned_tweet_id&tweet.fields=created_at,text`,
            {
                headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                },
            }
        );

        if (!response.ok) {
            console.error('Twitter API error:', response.status, response.statusText);
            return null;
        }

        const data: TwitterResponse = await response.json();

        if (data.data?.pinned_tweet_id) {
            return data.data.pinned_tweet_id;
        }

        return null;
    } catch (error) {
        console.error('Error fetching pinned tweet:', error);
        return null;
    }
}

export async function getTweetById(tweetId: string): Promise<TwitterTweet | null> {
    const bearerToken = import.meta.env.TWITTER_BEARER_TOKEN;

    if (!bearerToken) {
        return null;
    }

    try {
        const response = await fetch(
            `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=created_at,text`,
            {
                headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                },
            }
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.data || null;
    } catch (error) {
        console.error('Error fetching tweet:', error);
        return null;
    }
}
