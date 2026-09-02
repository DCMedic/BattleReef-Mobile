import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/app/screen';
import { Field, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { livestockKinds, type LivestockKind } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';

export default function NewLivestockScreen() {
  const router = useRouter();
  const { addLivestock } = useAppData();
  const [name,setName]=useState(''); const [species,setSpecies]=useState(''); const [quantity,setQuantity]=useState('1');
  const [kind,setKind]=useState<LivestockKind>('fish'); const [note,setNote]=useState('');
  async function save() {
    try {
      await addLivestock({ name, species, kind, quantity:Number(quantity), status:'active', acquiredAt:new Date().toISOString(), note });
      router.back();
    } catch (error) { Alert.alert('Unable to add livestock', error instanceof Error ? error.message : 'Try again.'); }
  }
  return <Screen subtitle="Add an inhabitant to this aquarium" title="New livestock">
    <Field label="Name" onChangeText={setName} placeholder="e.g. Yellow Tang" value={name} />
    <Field label="Species (optional)" onChangeText={setSpecies} placeholder="Zebrasoma flavescens" value={species} />
    <Field keyboardType="number-pad" label="Quantity" onChangeText={setQuantity} value={quantity} />
    <Text style={styles.label}>Type</Text>
    <View style={styles.chips}>{livestockKinds.map(x=><Pressable key={x} onPress={()=>setKind(x)} style={[styles.chip,kind===x&&styles.active]}><Text style={[styles.chipText,kind===x&&styles.activeText]}>{x}</Text></Pressable>)}</View>
    <Field label="Notes (optional)" multiline onChangeText={setNote} placeholder="Source, size, compatibility notes…" value={note} />
    <PrimaryButton label="Add livestock" onPress={()=>void save()} />
  </Screen>;
}
const styles=StyleSheet.create({label:{color:Brand.text,fontSize:13,fontWeight:'800'},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{paddingHorizontal:12,paddingVertical:9,borderRadius:11,backgroundColor:Brand.surface,borderWidth:1,borderColor:Brand.border},active:{backgroundColor:Brand.cyanSoft,borderColor:Brand.cyan},chipText:{color:Brand.textMuted,fontSize:12,fontWeight:'700',textTransform:'capitalize'},activeText:{color:Brand.cyan}});
