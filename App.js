import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({ handleNotification: async () => ({
  shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false
}) });

const KEY = '@pettrack_sdk58';
const C = { bg:'#F7F4FC', card:'#FFFFFF', ink:'#2E2940', muted:'#827B91', purple:'#8065C9', pale:'#EEE8FA', line:'#EAE5F1' };
const starterPets = [
  {id:'p1', name:'Milo', type:'Dog', breed:'Golden Retriever', age:'2 years', weight:'18 kg', emoji:'🐶'},
  {id:'p2', name:'Luna', type:'Cat', breed:'Persian', age:'1 year', weight:'4 kg', emoji:'🐱'}
];
const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const today = () => new Date().toISOString().slice(0,10);

export default function App() {
  const [tab,setTab] = useState('Home');
  const [pets,setPets] = useState(starterPets);
  const [reminders,setReminders] = useState([]);
  const [health,setHealth] = useState([]);
  const [loaded,setLoaded] = useState(false);
  const [modal,setModal] = useState('');
  const [name,setName] = useState(''), [kind,setKind] = useState('Dog'), [breed,setBreed] = useState('');
  const [age,setAge] = useState(''), [weight,setWeight] = useState(''), [notes,setNotes] = useState('');
  const [petId,setPetId] = useState('p1'), [title,setTitle] = useState(''), [category,setCategory] = useState('Feeding');
  const [date,setDate] = useState(today()), [time,setTime] = useState('08:00');

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) { const d=JSON.parse(raw); setPets(d.pets || []); setReminders(d.reminders || []); setHealth(d.health || []); }
      } catch(e) { console.warn('Could not load saved data',e); }
      setLoaded(true);
    })();
    if (Platform.OS !== 'web') Notifications.requestPermissionsAsync().catch(()=>{});
  }, []);
  useEffect(() => { if (loaded) AsyncStorage.setItem(KEY,JSON.stringify({pets,reminders,health})).catch(()=>{}); },[pets,reminders,health,loaded]);

  const petName = id => pets.find(p=>p.id===id)?.name || 'Pet';
  const open = type => {
    setModal(type); setName(''); setBreed(''); setAge(''); setWeight(''); setNotes(''); setTitle('');
    setDate(today()); setTime('08:00'); setPetId(pets[0]?.id || ''); setKind('Dog');
    setCategory(type==='health'?'Vaccination':'Feeding');
  };
  const save = async () => {
    if (modal==='pet') {
      if (!name.trim()) return Alert.alert('Name required','Enter your pet name.');
      const emoji={Dog:'🐶',Cat:'🐱',Bird:'🐦',Rabbit:'🐰',Other:'🐾'}[kind];
      setPets(v=>[...v,{id:uid(),name:name.trim(),type:kind,breed,age,weight,notes,emoji}]);
    } else {
      if (!pets.length) return Alert.alert('Add a pet first','Create a pet profile first.');
      if (!title.trim()) return Alert.alert('Title required','Enter a title.');
      const item={id:uid(),petId:petId||pets[0].id,title:title.trim(),category,date,time,notes,done:false};
      if (modal==='health') setHealth(v=>[item,...v]);
      else {
        setReminders(v=>[...v,item]);
        if (Platform.OS!=='web') {
          const [y,m,d]=date.split('-').map(Number),[h,mi]=time.split(':').map(Number),when=new Date(y,m-1,d,h,mi);
          if (when>new Date()) try {
            await Notifications.scheduleNotificationAsync({
              content:{title:`PetTrack: ${item.title}`,body:`Time to care for ${petName(item.petId)} 🐾`},
              trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:when}
            });
          } catch(e) { console.warn('Notification could not be scheduled',e); }
        }
      }
    }
    setModal('');
  };
  const removePet = id => Alert.alert('Remove pet?','Its reminders and health records will also be removed.',[
    {text:'Cancel',style:'cancel'},
    {text:'Remove',style:'destructive',onPress:()=>{setPets(v=>v.filter(p=>p.id!==id));setReminders(v=>v.filter(x=>x.petId!==id));setHealth(v=>v.filter(x=>x.petId!==id));}}
  ]);
  const toggle = id => setReminders(v=>v.map(x=>x.id===id?{...x,done:!x.done}:x));
  const field = (label,value,set,placeholder) => <View style={{marginBottom:12}}><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={set} placeholder={placeholder} placeholderTextColor="#AAA4B5" style={s.input}/></View>;
  const heading = (title,sub,action,fn) => <View style={s.heading}><View style={{flex:1}}><Text style={s.h1}>{title}</Text><Text style={s.muted}>{sub}</Text></View><Pressable style={s.smallBtn} onPress={fn}><Text style={s.smallTxt}>{action}</Text></Pressable></View>;
  const petChoices = <View style={s.wrap}>{pets.map(p=><Pressable key={p.id} onPress={()=>setPetId(p.id)} style={[s.chip,petId===p.id&&s.chipOn]}><Text>{p.emoji} {p.name}</Text></Pressable>)}</View>;

  return <SafeAreaView style={s.safe}>
    <View style={s.top}><View><Text style={s.logo}>🐾 PetTrack</Text><Text style={s.muted}>A little care, every day</Text></View><Text style={{fontSize:25}}>💜</Text></View>
    <View style={s.body}>
      {tab==='Home' && <ScrollView>
        <View style={s.hero}><Text style={s.kicker}>YOUR PET CARE SPACE</Text><Text style={s.heroTitle}>Happy pets,{"\n"}happy hearts.</Text><Text style={s.muted}>Keep every little paw healthy and cared for.</Text><Text style={s.art}>🐕　🐈　🐇</Text></View>
        <View style={s.row}><Text style={s.h2}>Your little family</Text><Pressable onPress={()=>setTab('Pets')}><Text style={s.link}>See all</Text></Pressable></View>
        <View style={s.wrap}>{pets.map(p=><View key={p.id} style={s.mini}><Text style={{fontSize:30}}>{p.emoji}</Text><Text style={s.bold}>{p.name}</Text><Text style={s.muted}>{p.type}</Text></View>)}<Pressable style={s.mini} onPress={()=>open('pet')}><Text style={s.plus}>＋</Text><Text style={s.muted}>Add pet</Text></Pressable></View>
        <View style={s.row}><Text style={s.h2}>Coming up</Text><Pressable onPress={()=>setTab('Reminders')}><Text style={s.link}>View all</Text></Pressable></View>
        {reminders.filter(x=>!x.done).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,4).map(x=><View key={x.id} style={s.card}><Text style={s.bold}>{x.time} · {x.title}</Text><Text style={s.muted}>{petName(x.petId)} · {x.date}</Text></View>)}
        <Pressable style={s.primary} onPress={()=>open('reminder')}><Text style={s.primaryText}>＋ Add a reminder</Text></Pressable>
      </ScrollView>}
      {tab==='Pets' && <ScrollView>{heading('My pets','Every member of your furry family.','＋ Add pet',()=>open('pet'))}
        {pets.map(p=><View key={p.id} style={s.card}><View style={s.row}><Text style={{fontSize:38}}>{p.emoji}</Text><View style={{flex:1}}><Text style={s.h2}>{p.name}</Text><Text style={s.muted}>{p.breed||p.type}</Text></View><Pressable onPress={()=>removePet(p.id)}><Text style={{color:'#B65D7A'}}>Remove</Text></Pressable></View><Text style={s.muted}>Type: {p.type}　 Age: {p.age||'—'}　 Weight: {p.weight||'—'}</Text>{p.notes?<Text style={s.muted}>{p.notes}</Text>:null}</View>)}
        {!pets.length&&<Text style={s.muted}>No pets yet. Add your first pet.</Text>}
      </ScrollView>}
      {tab==='Health' && <ScrollView>{heading('Health records','Vaccinations, medication and check-ups.','＋ Add record',()=>open('health'))}
        {health.map(x=><View key={x.id} style={s.card}><Text style={s.bold}>🩺 {x.title}</Text><Text style={s.muted}>{petName(x.petId)} · {x.category} · {x.date}</Text>{x.notes?<Text style={s.muted}>{x.notes}</Text>:null}</View>)}
        {!health.length&&<Text style={s.muted}>No health records yet. Add a vaccination or check-up.</Text>}
        <Text style={s.muted}>PetTrack is an organiser, not a veterinary service. Contact a qualified vet for medical advice.</Text>
      </ScrollView>}
      {tab==='Reminders' && <ScrollView>{heading('Reminders','A gentle nudge for every important task.','＋ Add',()=>open('reminder'))}
        {reminders.map(x=><Pressable key={x.id} onPress={()=>toggle(x.id)} style={s.card}><Text style={s.bold}>{x.done?'☑':'◯'} {x.title}</Text><Text style={s.muted}>{petName(x.petId)} · {x.category} · {x.date} at {x.time}</Text></Pressable>)}
        {!reminders.length&&<Text style={s.muted}>No reminders yet.</Text>}
        <Text style={s.muted}>Tap a reminder to mark it complete.</Text>
      </ScrollView>}
    </View>
    <View style={s.nav}>{['Home','Pets','Health','Reminders'].map((t,i)=><Pressable key={t} onPress={()=>setTab(t)} style={s.navItem}><Text style={{fontSize:20}}>{['⌂','🐾','♡','◷'][i]}</Text><Text style={[s.navText,tab===t&&{color:C.purple}]}>{t}</Text></Pressable>)}</View>
    <Modal visible={!!modal} transparent animationType="slide" onRequestClose={()=>setModal('')}><View style={s.shade}><ScrollView style={s.modal} keyboardShouldPersistTaps="handled">
      <View style={s.row}><Text style={s.h2}>{modal==='pet'?'Add a pet 🐾':modal==='health'?'Add health record':'New reminder'}</Text><Pressable onPress={()=>setModal('')}><Text style={s.muted}>Close ✕</Text></Pressable></View>
      {modal==='pet'?<>{field('Pet name *',name,setName,'e.g. Milo')}<Text style={s.label}>Pet type</Text><View style={s.wrap}>{['Dog','Cat','Bird','Rabbit','Other'].map(t=><Pressable key={t} onPress={()=>setKind(t)} style={[s.chip,kind===t&&s.chipOn]}><Text>{t}</Text></Pressable>)}</View>{field('Breed',breed,setBreed,'Optional')}{field('Age',age,setAge,'e.g. 2 years')}{field('Weight',weight,setWeight,'e.g. 8 kg')}{field('Notes',notes,setNotes,'Optional')}</>:<><Text style={s.label}>Pet</Text>{petChoices}{field('Title *',title,setTitle,'e.g. Evening walk')}<Text style={s.label}>Category</Text><View style={s.wrap}>{(modal==='health'?['Vaccination','Medication','Check-up','Allergy','Other']:['Feeding','Medication','Exercise','Grooming','Vet visit','Other']).map(c=><Pressable key={c} onPress={()=>setCategory(c)} style={[s.chip,category===c&&s.chipOn]}><Text>{c}</Text></Pressable>)}</View>{field('Date (YYYY-MM-DD)',date,setDate,'2026-11-17')}{modal==='reminder'&&field('Time (HH:MM)',time,setTime,'08:00')}{field('Notes',notes,setNotes,'Optional')}</>}
      <Pressable style={s.primary} onPress={save}><Text style={s.primaryText}>Save</Text></Pressable><View style={{height:25}}/>
    </ScrollView></View></Modal>
  </SafeAreaView>;
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},top:{padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},logo:{fontSize:24,fontWeight:'900',color:C.ink},body:{flex:1,paddingHorizontal:18},nav:{flexDirection:'row',justifyContent:'space-around',backgroundColor:'#fff',paddingVertical:12,borderTopWidth:1,borderColor:C.line},navItem:{alignItems:'center'},navText:{fontSize:11,color:C.muted,marginTop:3,fontWeight:'700'},
 hero:{backgroundColor:'#EDE6FA',padding:21,borderRadius:23,marginVertical:8},kicker:{fontSize:10,letterSpacing:1.4,color:C.purple,fontWeight:'900'},heroTitle:{fontSize:30,lineHeight:35,fontWeight:'900',color:C.ink,marginVertical:9},art:{fontSize:28,marginTop:13},row:{flexDirection:'row',alignItems:'center',gap:10,marginVertical:9},h1:{fontSize:25,fontWeight:'900',color:C.ink},h2:{fontSize:18,fontWeight:'900',color:C.ink},bold:{fontSize:14,fontWeight:'900',color:C.ink},muted:{fontSize:12,color:C.muted,marginTop:4},link:{fontSize:12,color:C.purple,fontWeight:'900'},wrap:{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:9},mini:{width:100,backgroundColor:'#fff',padding:13,borderRadius:17,alignItems:'center'},plus:{fontSize:25,color:C.purple},card:{backgroundColor:'#fff',padding:15,borderRadius:17,marginVertical:7},primary:{backgroundColor:C.purple,padding:15,borderRadius:14,alignItems:'center',marginVertical:14},primaryText:{color:'#fff',fontWeight:'900'},heading:{flexDirection:'row',alignItems:'center',marginVertical:13,gap:8},smallBtn:{backgroundColor:C.pale,padding:10,borderRadius:11},smallTxt:{color:C.purple,fontSize:11,fontWeight:'900'},chip:{backgroundColor:'#fff',borderWidth:1,borderColor:C.line,borderRadius:10,padding:9},chipOn:{backgroundColor:C.pale,borderColor:C.purple},shade:{flex:1,backgroundColor:'#0006',justifyContent:'flex-end'},modal:{maxHeight:'92%',backgroundColor:C.bg,borderTopLeftRadius:25,borderTopRightRadius:25,padding:20},label:{fontSize:12,fontWeight:'900',color:C.ink,marginBottom:6},input:{backgroundColor:'#fff',borderWidth:1,borderColor:C.line,borderRadius:12,padding:12,color:C.ink,marginBottom:11}
});
