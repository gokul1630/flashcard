import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';

export default FlipCard = ({
    isFlipped,
    RegularContent,
    FlippedContent,
    cardStyle,
    onPressCard,
}) => {
    return (
        <Pressable onPress={onPressCard}>
            <View style={[cardStyle]}>
                {isFlipped ? FlippedContent : RegularContent}
            </View>
        </Pressable>
    );
};

const flipCardStyles = StyleSheet.create({});
