import { generateId } from "src/app/shared/utils/utils";

export interface IThemeModel {
    id: string,
    userEmail: string,
    isDarkMode: boolean,
    savedTheme: any,
    langague: string,
    userAvatar: string,
}

export class ThemeModel implements IThemeModel {
    id: string;
    userEmail: string;
    isDarkMode: boolean;
    savedTheme: any;
    langague: string;
    userAvatar: string;

    constructor(themeModel: IThemeModel) {
        this.id = themeModel.id;
        this.userEmail = themeModel.userEmail;
        this.isDarkMode = themeModel.isDarkMode;
        this.savedTheme = themeModel.savedTheme;
        this.langague = themeModel.langague;
        this.userAvatar = themeModel.userAvatar;
    }
}

export const mockTheme: IThemeModel[] = [
    new ThemeModel({
        id: generateId(),
        userEmail: '',
        isDarkMode: true,
        savedTheme: '',
        langague: 'en',
        userAvatar: '',
    }),
]
