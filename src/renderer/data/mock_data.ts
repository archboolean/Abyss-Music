import { TrackItem, PlaylistItem } from '../../shared/models';

export interface UIMockTrack extends TrackItem {
  coverGradient: string;
}

export interface UIMockPlaylist extends PlaylistItem {
  coverGradient: string;
}

export const MOCK_TRACKS: UIMockTrack[] = [
  {
    id: 'track-1',
    title: 'Спокойная ночь',
    artist: 'Кино',
    album: 'Группа крови',
    durationSeconds: 385,
    sourceType: 'local',
    audioUrl: '',
    isFavorite: true,
    coverGradient: 'linear-gradient(135deg, #3a3532 0%, #1c1b1a 100%)',
  },
  {
    id: 'track-2',
    title: 'Кукушка',
    artist: 'Кино',
    album: 'Чёрный альбом',
    durationSeconds: 398,
    sourceType: 'local',
    audioUrl: '',
    isFavorite: true,
    coverGradient: 'linear-gradient(135deg, #4a3f35 0%, #211e1c 100%)',
  },
  {
    id: 'track-3',
    title: 'Линия жизни',
    artist: 'Сплин',
    album: '25-й кадр',
    durationSeconds: 220,
    sourceType: 'online',
    audioUrl: '',
    isFavorite: true,
    coverGradient: 'linear-gradient(135deg, #2d3846 0%, #181c22 100%)',
  },
  {
    id: 'track-4',
    title: 'Выхода нет',
    artist: 'Сплин',
    album: 'Гранатовый альбом',
    durationSeconds: 225,
    sourceType: 'online',
    audioUrl: '',
    isFavorite: true,
    coverGradient: 'linear-gradient(135deg, #4b2e32 0%, #1f1719 100%)',
  },
  {
    id: 'track-5',
    title: 'Нажми на кнопку',
    artist: 'Технология',
    album: 'Всё, что ты хочешь',
    durationSeconds: 210,
    sourceType: 'local',
    audioUrl: '',
    isFavorite: false,
    coverGradient: 'linear-gradient(135deg, #313b38 0%, #181d1b 100%)',
  },
  {
    id: 'track-6',
    title: 'Ночной силуэт',
    artist: 'Abyss Session',
    album: 'Deep Horizon',
    durationSeconds: 194,
    sourceType: 'online',
    audioUrl: '',
    isFavorite: false,
    coverGradient: 'linear-gradient(135deg, #3c3747 0%, #1b1920 100%)',
  },
];

export const INITIAL_PLAYLISTS: UIMockPlaylist[] = [
  {
    id: 'pl-1',
    name: 'Вечерний чилл',
    trackIds: ['track-1', 'track-3', 'track-6'],
    coverGradient: 'linear-gradient(135deg, #4d4136 0%, #24201c 100%)',
  },
  {
    id: 'pl-2',
    name: 'Для фокуса',
    trackIds: ['track-4', 'track-5', 'track-6'],
    coverGradient: 'linear-gradient(135deg, #2e3b47 0%, #181e24 100%)',
  },
  {
    id: 'pl-3',
    name: 'Русский рок',
    trackIds: ['track-1', 'track-2', 'track-3', 'track-4'],
    coverGradient: 'linear-gradient(135deg, #463235 0%, #201819 100%)',
  },
];

export const WAVE_CATEGORIES = {
  mood: ['Спокойное', 'Бодрое', 'Грустное', 'Весёлое', 'Мрачное', 'Романтичное'],
  activity: ['Для фокуса', 'В дорогу', 'Тренировка', 'Вечерний чилл', 'Ночью', 'Для кода'],
  character: ['Любимое', 'Незнакомое', 'Популярное', 'Новинки'],
  genre: ['Рок', 'Инди', 'Электроника', 'Хип-хоп', 'Лоу-фай', 'Акустика'],
} as const;