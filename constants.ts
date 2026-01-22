import { Song, UserStats } from './types';

export const CURRENT_USER: UserStats = {
    level: 5,
    analysisCount: 124,
    savedSongs: 38,
    uid: "8930412",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWYSxF7dwdniHO_8diBEARblqUyfJK35N0ilg9Cp3bBAnHjLdOoDNGjjQsiVfqnCg6MD1nKELqDrBztOtXVXD4U_4AnjWpAEoviUBJSjOLIuGiixFMvsZOKG1vboduug31mEsSByMZXB0aSbP3rvYUwotuBsaNPKo6C-hPFNNWBqn-R49msNeG20URLkAyy7Q4GEsw9pqZzcScy6-PdqFuURuK-4BXb11JVDG1XERKrmPEOHdbXU6FKo1bsuHb4Lp89TrWogwCGL38"
};

export const MATCH_SONGS: Song[] = [
    {
        id: '1',
        title: "Rolling in the Deep",
        artist: "阿黛尔",
        album: "21",
        coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBb_hzIoULixmV0-2zQZr4KO9pyXNAHKyIm19F8twJlOImaLiQdEHg8cqd3ngCeyDcTg560r8VsDs6u934ukkh9BwoMof7Aj-jk6JZ7qAkkuolfhtiXWUartn_vnZAlMPAV2DQFECMEbLWhyai1C7R-cf_4LR_N3dE3iUgvs5J_TnbKzW8QHhFUkzQscOox4QMiT0YesFKBLn1TAB4_7wSxjWcdE7toeKT8twa9k2WCg-p-HZYSOTrTpsP3b7GccqNoWfgIirosltPW",
        tag: 'comfort',
        tagLabel: '完美契合'
    },
    {
        id: '2',
        title: "Easy On Me",
        artist: "阿黛尔",
        album: "30",
        coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoYs6gl-e-COScdrbRKTQaknU4VvfN4rRoyJ7PqfEhy1x55vLB9K6TwqURFCYAsvn2_F_a21X2IEvJrQJBZmzancAg1_6TEnvVi_Sg8q0CKFIYQ9PcKwGxN4faYzjs58U1T26oA8yFhiVsqN0cOxZcD2RDvc5alEHyapdeV96ypGOYxegDvalIXRNfWrDFDf4kOHFX0_HMkmTZMNC2K6Wl93QVqWrpdaBVZNc6wIv9Bagi4Fud9Z-2K4LijVzAm8eFoKnmdMlejWJW",
        tag: 'comfort',
        tagLabel: '非常适合'
    },
    {
        id: '3',
        title: "Skyfall",
        artist: "阿黛尔",
        album: "Skyfall",
        coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAR3nbYBVOKnBpYu1eEXzkPq4moF_9Mht2aXP0smMNAPPHlXayZ2oWeiKrvWkbegx4CLRMCN5J6s9YoQLvSCNDeFw2Luz6Gu5r8ULdpxt38gpsxm8C9ip-IMB57z8R6KonlKM7iOIJN-WhTGa0uOVDFhCvzx5r7WOwszWrGeZHj5JqJGGAtWjXxtVwItfO9WArR5GldCxbPpd-8UPm319a_NUuc_q5OKG5yLklI6uqfxte3msNANmdG68EyACVhEJcDKmsmBW3eBXSO",
        tag: 'challenge',
        tagLabel: '极具挑战'
    }
];

export const FAVORITE_SONGS: Song[] = [
    {
        id: '1',
        title: "光年之外",
        artist: "G.E.M. 邓紫棋",
        album: "",
        coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDIbDklDKdvivlOXGNaNvjdlKnXGc7kRnvo2ZHqoANrOAasKEfHKBmlD8FQTt5C1YmLDJowmM7TzRO5o1QLSljnOFazAMLYJ_J6edbJFKSZci5EF3UlVWo_nBzSHEVWFfiig8EAnuiB2in4u4xtM9rHq8NH7SSPeWvGJcSW9_CHJkjLHISCQIGDH98KbPpMdkT1s3_1WDgXNFe92eQyQCkKC0RViLHjjUwsyNPWzUaXbPCLuDkv4VVvniG7hJAEUkibD8cNo8eD7P7b",
        tag: 'challenge',
        tagLabel: '挑战区'
    },
    {
        id: '2',
        title: "简单爱",
        artist: "周杰伦",
        album: "",
        coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBisgdXwFNGnADME26zZ2gYAujL0QpSBs4i84lWLK4hruZbIs6fKmcxqlQbqak-9oQ1Ujj6DBVu_EdQB_iPWNxjvSvID9qV2gbA746sFc5kSFtFI_2LfwW2HZVdjwd5NeBFUIwIpghOanLczsWdtr-5yYjGJLzxeiJ68PhLBABqduFa2zJrAOhZnaEqTyyrrI2UZ0Wc8FRXkyc8u7e-cH7iuONPUOR6NQAREDh0FQFeGuC8VOAYFS_tjWCIECq99yPR1e_knCYN9sGZ",
        tag: 'comfort',
        tagLabel: '舒适区'
    },
    {
        id: '3',
        title: "Last Dance",
        artist: "伍佰",
        album: "",
        coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOdMNNa8yBBp1hJ3y-1omVCRXGb5ZtkC0eCXTyYip9cycOq6viIfXt3tQ4wi6XdaDeM3WSVIhdpamTOa-dbaRhKkPBO7-tBFRabuQGcI-gAkllTChNjpbYiOY6g9NMu_cdEYs1D0EPRLrBKqHUuaHMTufuIkBaJuHxU7B_qDBVRQsibUeW9ncTKuVPJ_QoZNHrh8qdrps_2VoXwCVVYw5gzTkthDP4C3HXvIcfucmWC8imCuOqPVhRiYXj9azUijFYlInNexVT04fN",
        tag: 'comfort',
        tagLabel: '舒适区'
    },
    {
        id: '4',
        title: "孤勇者",
        artist: "陈奕迅",
        album: "",
        coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAiVO8sYNwRXWWEGxaWecy16a5noaHFbCeetuaL_fDUADN5KrGDG-1w7rkz5qYcadmEWNXgwBVvh20PIY0iQ-LZr-ji-kre4lezzXvcq0M5NESeMDvJuHzf8PEu0HxokfrsysTs2HWZi048irrYiXTN-uy3omecmpMxeQEaodsLxHMwo6-gX8w1ci-VjLh_fqX24egNvfPzxULggu9e4dDLdmdJPpoOGhfTwf8Ie2NMrqUPfVkzdwGnoMDLZWSi9ilx3v8T3dPcRvJE",
        tag: 'challenge',
        tagLabel: '挑战区'
    }
];

export const RADAR_DATA = [
    { subject: '温暖度', A: 100, B: 95, fullMark: 150 },
    { subject: '明亮度', A: 85, B: 90, fullMark: 150 },
    { subject: '力量感', A: 85, B: 85, fullMark: 150 },
    { subject: '音域', A: 70, B: 80, fullMark: 150 },
    { subject: '气息感', A: 90, B: 80, fullMark: 150 },
];
