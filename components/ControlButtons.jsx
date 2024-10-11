import Reload from '@/assets/images/reload.png';
import SpeakerIcon from '@/assets/images/speaker.png';
import React from 'react';
import { StyleSheet, View, Pressable, Image } from 'react-native';

const ControlButtons = ({ handleAudio, handleFlip, containerStyle }) => (
    <View style={[styles.container, containerStyle]}>
        {handleFlip ? (
            <Pressable hitSlop={10} onPress={handleFlip}>
                <Image style={styles.iconStyle} source={Reload} />
            </Pressable>
        ) : null}

        {handleAudio ? (
            <Pressable hitSlop={10} onPress={handleAudio}>
                <Image style={styles.iconStyle} source={SpeakerIcon} />
            </Pressable>
        ) : null}
    </View>
);

const styles = StyleSheet.create({
    container: { flexDirection: 'row', gap: 20 },
    iconStyle: {
        width: 18,
        height: 18,
    },
});

export default ControlButtons;
