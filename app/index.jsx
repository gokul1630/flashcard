import { colors } from '@/common/colors';
import Card from '@/components/Card';
import ControlButtons from '@/components/ControlButtons';
import FlipCard from '@/components/FlipCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const data = [
    {
        id: '1',
        english: 'Hello, how are you?',
        german: 'Hallo, wie geht es dir?',
        nextReviewTime: 0,
    },
    {
        id: '2',
        english: 'I am fine, thank you.',
        german: 'Mir geht es gut, danke.',
        nextReviewTime: 0,
    },
    {
        id: '3',
        english: 'What is your name?',
        german: 'Wie heißt du?',
        nextReviewTime: 0,
    },
    {
        id: '4',
        english: 'My name is John.',
        german: 'Ich heiße John.',
        nextReviewTime: 0,
    },
    {
        id: '5',
        english: 'Where are you from?',
        german: 'Woher kommst du?',
        nextReviewTime: 0,
    },
    {
        id: '6',
        english: 'I am from Germany.',
        german: 'Ich komme aus Deutschland.',
        nextReviewTime: 0,
    },
    {
        id: '7',
        english: 'Nice to meet you.',
        german: 'Freut mich, dich kennenzulernen.',
        nextReviewTime: 0,
    },
    {
        id: '8',
        english: 'How old are you?',
        german: 'Wie alt bist du?',
        nextReviewTime: 0,
    },
    {
        id: '9',
        english: 'I am 25 years old.',
        german: 'Ich bin 25 Jahre alt.',
        nextReviewTime: 0,
    },
    {
        id: '10',
        english: 'Can you help me, please?',
        german: 'Kannst du mir bitte helfen?',
        nextReviewTime: 0,
    },
];

const voiceId = process.env.EXPO_PUBLIC_ELEVENLABS_VOICEID;
const elevenlabsApi = process.env.EXPO_PUBLIC_ELEVENLABS_TOKEN;

const elevenLabsUrl = `${process.env.EXPO_PUBLIC_ELEVENLABS_BASEURL}${voiceId}`;

const headers = {
    Accept: 'audio/mpeg',
    'Content-Type': 'application/json',
    'xi-api-key': elevenlabsApi,
};

const cardSizeRatio = 0.8;

const { width } = Dimensions.get('window');

const loadFlashcards = async () => {
    const initialData = { savedIndex: 0, cardData: data };
    try {
        const storedFlashcards = await AsyncStorage.getItem('flashcards');
        return storedFlashcards ? JSON.parse(storedFlashcards) : initialData;
    } catch (error) {
        console.error('Failed to load flashcards:', error);
        return initialData;
    }
};

const saveFlashcards = async (flashcards, savedIndex) => {
    try {
        await AsyncStorage.setItem(
            'flashcards',
            JSON.stringify({ cardData: flashcards, savedIndex })
        );
    } catch (error) {
        console.error('Failed to save flashcards:', error);
    }
};

const Index = () => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flashcards, setFlashcards] = useState(data);

    const isCardDueForReview = (card) => {
        const now = Date.now();
        return (
            !card?.nextReviewTime ||
            new Date(card?.nextReviewTime).getTime() <= now
        );
    };

    const getNextCardForReview = () => {
        const dueCard = flashcards?.find(isCardDueForReview);
        if (dueCard) {
            return dueCard;
        }
        return flashcards[0];
    };

    const currentCard = getNextCardForReview();
    const currentEnglishWords = currentCard?.english;
    const currentGermanWords = currentCard?.german;

    const handleFlip = () => {
        setIsFlipped((state) => !state);
    };

    const handleUserChoice = (level) => {
        setIsFlipped(false);
        const now = Date.now();
        let nextReviewTime;

        switch (level) {
            case 'hard':
                nextReviewTime = now + 10 * 60 * 1000;
                break;
            case 'medium':
                nextReviewTime = now + 3 * 24 * 60 * 60 * 1000;
                break;
            case 'easy':
                nextReviewTime = now + 7 * 24 * 60 * 60 * 1000;
                break;
        }

        setFlashcards((prevFlashcards) => {
            const updatedFlashcards = [...prevFlashcards];
            updatedFlashcards[currentIndex].nextReviewTime = nextReviewTime;
            return updatedFlashcards;
        });
        setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
    };

    const playAudio = async () => {
        const fileDir = FileSystem.documentDirectory + 'translator_audios';
        const mp3Dir = `${fileDir}/${isFlipped ? 'german' : 'english'}_${
            flashcards[currentIndex]?.id
        }.mp3`;

        const payload = {
            text: isFlipped ? currentGermanWords : currentEnglishWords,
            model_id: 'eleven_monolingual_v1',
        };

        try {
            const mp3DirInfo = await FileSystem.getInfoAsync(mp3Dir);
            if (!mp3DirInfo.exists) {
                const response = await axios.post(elevenLabsUrl, payload, {
                    headers,
                    responseType: 'blob',
                });

                const reader = new FileReader();
                reader.readAsDataURL(response.data);
                reader.onloadend = async () => {
                    const base64Data = reader?.result.split(',')[1];

                    const dirInfo = await FileSystem.getInfoAsync(fileDir);
                    if (!dirInfo.exists) {
                        console.log("Gif directory doesn't exist, creating…");
                        await FileSystem.makeDirectoryAsync(fileDir, {
                            intermediates: true,
                        });
                    }
                    await FileSystem.writeAsStringAsync(mp3Dir, base64Data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                };
            }

            const { sound } = await Audio.Sound.createAsync({
                uri: mp3Dir,
            });

            await sound.playAsync();
        } catch (error) {
            console.log(error);
        }
    };

    const initializeFlashcards = async () => {
        const { cardData, savedIndex } = await loadFlashcards();
        setFlashcards(cardData);
        setCurrentIndex(savedIndex);
        setRefreshing(false);
    };

    useEffect(() => {
        initializeFlashcards();
    }, []);

    useEffect(() => {
        if (flashcards.length > 0) {
            saveFlashcards(flashcards, currentIndex);
        }
    }, [flashcards, currentIndex]);

    const onRefresh = () => {
        setRefreshing(true);
        initializeFlashcards();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.contentContainerStyle}
                refreshControl={
                    <RefreshControl
                        onRefresh={onRefresh}
                        refreshing={refreshing}
                    />
                }>
                <FlipCard
                    onPressCard={handleFlip}
                    isFlipped={isFlipped}
                    cardStyle={styles.flipCard}
                    RegularContent={
                        <Card containerStyle={styles.card}>
                            <ControlButtons
                                containerStyle={styles.btnContainer}
                                handleAudio={playAudio}
                            />
                            <Text style={styles.contextText}>
                                {currentEnglishWords}
                            </Text>
                            <View
                                style={[
                                    styles.regularCardFooter,
                                    styles.flippedCardFooter,
                                ]}>
                                <Text style={styles.regularCardFooterText}>
                                    Click the card to flip
                                </Text>
                            </View>
                        </Card>
                    }
                    FlippedContent={
                        <Card containerStyle={[styles.card]}>
                            <ControlButtons
                                containerStyle={styles.btnContainer}
                                handleAudio={playAudio}
                                handleFlip={handleFlip}
                            />

                            <Text style={styles.contextText}>
                                {currentGermanWords}
                            </Text>
                            <View style={styles.flippedCardFooter}>
                                <Pressable
                                    onPress={() => handleUserChoice('easy')}
                                    style={[
                                        styles.footerLevels,
                                        styles.easyLevel,
                                    ]}>
                                    <Text style={styles.flippedFooterText}>
                                        Easy
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => handleUserChoice('medium')}
                                    style={[
                                        styles.footerLevels,
                                        styles.mediumLevel,
                                    ]}>
                                    <Text style={styles.flippedFooterText}>
                                        Medium
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => handleUserChoice('hard')}
                                    style={[
                                        styles.footerLevels,
                                        styles.hardLevel,
                                    ]}>
                                    <Text style={styles.flippedFooterText}>
                                        Hard
                                    </Text>
                                </Pressable>
                            </View>
                        </Card>
                    }
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.containerBackground,
    },
    flipCard: {
        height: width * cardSizeRatio,
        width: width * cardSizeRatio,
    },

    card: {
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        width: width * cardSizeRatio,
        height: width * cardSizeRatio,
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowRadius: 5,
        shadowOpacity: 0.5,
        elevation: 5,
    },

    contextText: { color: colors.black, fontSize: 24, textAlign: 'center' },

    btnContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
    },

    regularCardFooter: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.cardFooter,
    },

    regularCardFooterText: {
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
        color: colors.white,
    },
    flippedCardFooter: {
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        position: 'absolute',
        height: width * 0.09,
    },

    footerLevels: {
        flex: 1,
        justifyContent: 'center',
    },
    easyLevel: {
        backgroundColor: colors.easyLevel,
    },
    mediumLevel: {
        backgroundColor: colors.mediumLevel,
    },
    hardLevel: {
        backgroundColor: colors.hardLevel,
    },

    flippedFooterText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.white,
        textAlign: 'center',
    },

    contentContainerStyle: { flexGrow: 1, justifyContent: 'center' },
});

export default Index;
