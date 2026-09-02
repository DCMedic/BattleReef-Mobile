import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/app/screen';
import { Field, PrimaryButton } from '@/components/app/ui';
import { Brand } from '@/constants/theme';
import { equipmentKinds, type EquipmentKind } from '@/domain/models';
import { useAppData } from '@/providers/app-data-provider';

export default function NewEquipmentScreen() {
  const router=useRouter(); const { addEquipment }=useAppData();
  const [name,setName]=useState(''); const [manufacturer,setManufacturer]=useState(''); const [model,setModel]=useState('');
  const [kind,setKind]=useState<EquipmentKind>('pump'); const [note,setNote]=useState('');
  async function save(){
    try{
      await addEquipment({name,manufacturer,model,kind,status:'active',installedAt:new Date().toISOString(),warrantyEndsAt:null,note});
      router.back();
    }catch(error){Alert.alert('Unable to add equipment',error instanceof Error?error.message:'Try again.');}
  }
  return <Screen subtitle="Track hardware without controlling it" title="New equipment">
    <Field label="Equipment name" onChangeText={setName} placeholder="e.g. Return Pump" value={name}/>
    <Field label="Manufacturer (optional)" onChangeText={setManufacturer} placeholder="Manufacturer" value={manufacturer}/>
    <Field label="Model (optional)" onChangeText={setModel} placeholder="Model" value={model}/>
    <Text style={styles.label}>Type</Text>
    <View style={styles.chips}>{equipmentKinds.map(x=><Pressable key={x} onPress={()=>setKind(x)} style={[styles.chip,kind===x&&styles.active]}><Text style={[styles.chipText,kind===x&&styles.activeText]}>{x}</Text></Pressable>)}</View>
    <Field label="Notes (optional)" multiline onChangeText={setNote} placeholder="Serial, settings, service notes…" value={note}/>
    <PrimaryButton label="Add equipment" onPress={()=>void save()}/>
  </Screen>;
}
const styles=StyleSheet.create({label:{color:Brand.text,fontSize:13,fontWeight:'800'},chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{paddingHorizontal:12,paddingVertical:9,borderRadius:11,backgroundColor:Brand.surface,borderWidth:1,borderColor:Brand.border},active:{backgroundColor:Brand.cyanSoft,borderColor:Brand.cyan},chipText:{color:Brand.textMuted,fontSize:12,fontWeight:'700',textTransform:'capitalize'},activeText:{color:Brand.cyan}});
