import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/app/screen';
import { EmptyState, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { useAppData } from '@/providers/app-data-provider';
import { formatWhen } from '@/utils/format';

export default function SubjectPhotoSeriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ livestockId?: string }>();
  const { livestock, markPhotoMissing, photos, selectedAquarium } = useAppData();
  const subject = livestock.find((item) => item.id === params.livestockId);
  const subjectPhotos = photos
    .filter((photo) => photo.linkedLivestockId === params.livestockId)
    .sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
  const available = subjectPhotos.filter((photo) => photo.mediaState !== 'missing');
  const spanDays = available.length >= 2
    ? Math.round((Date.parse(available[available.length - 1].capturedAt) - Date.parse(available[0].capturedAt)) / 86_400_000)
    : 0;

  if (!subject || !selectedAquarium) {
    return <Screen title="Visual history"><EmptyState body="This livestock visual history is unavailable." icon="images-outline" title="Subject unavailable" /></Screen>;
  }

  return (
    <Screen
      action={<Pressable accessibilityLabel="Add subject photo" onPress={() => router.push({ pathname: '/photo/new', params: { livestockId: subject.id } })} style={styles.add}><Ionicons color={Brand.cyan} name="camera-outline" size={22} /></Pressable>}
      subtitle={subject.species || subject.kind}
      title={subject.name}>
      <View style={styles.summary}>
        <View><Text style={styles.metric}>{subjectPhotos.length}</Text><Text style={styles.metricLabel}>photos</Text></View>
        <View><Text style={styles.metric}>{spanDays}</Text><Text style={styles.metricLabel}>days tracked</Text></View>
        <View><Text style={styles.metric}>{subject.status}</Text><Text style={styles.metricLabel}>status</Text></View>
      </View>

      {available.length >= 2 ? (
        <PrimaryButton
          icon="git-compare-outline"
          label="Compare first and latest"
          onPress={() => router.push({ pathname: '/photo/compare', params: { before: available[0].id, after: available[available.length - 1].id } })}
        />
      ) : null}

      {subjectPhotos.length === 0 ? (
        <EmptyState
          action={<PrimaryButton icon="camera-outline" label="Add first photo" onPress={() => router.push({ pathname: '/photo/new', params: { livestockId: subject.id } })} />}
          body="Link photos to this livestock record to build a chronological visual history."
          icon="images-outline"
          title="No visual history yet"
        />
      ) : (
        <View style={styles.timeline}>
          {subjectPhotos.map((photo, index) => (
            <View key={photo.id} style={styles.entry}>
              <View style={styles.rail}>
                <View style={styles.dot} />
                {index < subjectPhotos.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <View style={styles.content}>
                <Text style={styles.date}>{formatWhen(photo.capturedAt)}</Text>
                {photo.mediaState === 'missing' ? (
                  <View style={styles.missing}><Ionicons color={Brand.amber} name="image-outline" size={25} /><Text style={styles.missingText}>Photo file unavailable</Text></View>
                ) : (
                  <Image onError={() => void markPhotoMissing(photo.id)} source={{ uri: photo.uri }} style={styles.image} />
                )}
                {photo.caption ? <Text style={styles.caption}>{photo.caption}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles=StyleSheet.create({
  add:{width:44,height:44,borderRadius:14,backgroundColor:Brand.surface,borderWidth:1,borderColor:Brand.border,alignItems:'center',justifyContent:'center'},
  summary:{flexDirection:'row',gap:10},
  metric:{color:Brand.cyan,fontSize:20,fontWeight:'900',textTransform:'capitalize'},
  metricLabel:{color:Brand.textMuted,fontSize:9,fontWeight:'800',textTransform:'uppercase',letterSpacing:.7},
  timeline:{gap:0},
  entry:{flexDirection:'row',gap:12},
  rail:{width:18,alignItems:'center'},
  dot:{width:11,height:11,borderRadius:6,backgroundColor:Brand.cyan,marginTop:5},
  line:{width:2,flex:1,minHeight:30,backgroundColor:Brand.border},
  content:{flex:1,paddingBottom:18,gap:7},
  date:{color:Brand.text,fontSize:12,fontWeight:'900'},
  image:{width:'100%',aspectRatio:1.3,borderRadius:15,backgroundColor:Brand.surfaceRaised},
  missing:{width:'100%',minHeight:150,borderRadius:15,backgroundColor:Brand.surfaceRaised,alignItems:'center',justifyContent:'center',gap:6},
  missingText:{color:Brand.amber,fontSize:11,fontWeight:'800'},
  caption:{color:Brand.textMuted,fontSize:11,lineHeight:16},
});
