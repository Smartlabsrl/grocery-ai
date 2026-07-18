import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { recipes, stores, Recipe, Store } from './src/data';

type Tab = 'scopri' | 'ricette' | 'crea' | 'profilo';

function StoreCard({ store, onSelect }: { store: Store; onSelect: () => void }) {
  return <Pressable onPress={onSelect} style={styles.storeCard}>
    <View style={styles.storeIcon}><Text style={styles.storeIconText}>亚</Text></View>
    <View style={styles.storeInfo}><Text style={styles.storeName}>{store.name}</Text><Text style={styles.muted}>{store.city} · {store.distanceKm} km</Text><Text style={styles.open}>{store.open ? `Aperto · ${store.minutes} min a piedi` : 'Chiuso ora'}</Text><View style={styles.tags}>{store.tags.slice(0, 3).map(tag => <Text key={tag} style={styles.tag}>{tag}</Text>)}</View></View>
    <Text style={styles.rating}>★ {store.rating}</Text>
  </Pressable>;
}

function RecipeCard({ recipe, owned, onSelect }: { recipe: Recipe; owned: number; onSelect: () => void }) {
  return <Pressable onPress={onSelect} style={[styles.recipeCard, { borderLeftColor: recipe.accent }]}>
    <View style={[styles.recipeArt, { backgroundColor: recipe.accent }]}><Text style={styles.recipeEmoji}>🥢</Text></View>
    <View style={styles.recipeInfo}><Text style={styles.recipeTitle}>{recipe.title}</Text><Text style={styles.muted}>{recipe.subtitle}</Text><Text style={styles.recipeMeta}>{recipe.duration} · {recipe.difficulty} · {owned}/{recipe.ingredients.length} ingredienti</Text></View>
  </Pressable>;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('scopri');
  const [query, setQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [saved, setSaved] = useState<string[]>(['shrimp-noodles']);
  const [locationLabel, setLocationLabel] = useState('Milano, Lombardia');
  const [pantry, setPantry] = useState(['Spaghetti di riso', 'Gamberi', 'Uova']);

  const filteredStores = useMemo(() => stores.filter(store => `${store.name} ${store.city} ${store.products.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const owned = (recipe: Recipe) => recipe.ingredients.filter(i => pantry.includes(i)).length;

  async function useMyLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Posizione non disponibile', 'Puoi cercare manualmente una città o abilitare la posizione dalle impostazioni.'); return; }
    const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setLocationLabel(`Vicino a te · ${result.coords.latitude.toFixed(2)}, ${result.coords.longitude.toFixed(2)}`);
  }

  function selectStore(store: Store) { setSelectedStore(store); setTab('ricette'); }
  function toggleSave(id: string) { setSaved(value => value.includes(id) ? value.filter(item => item !== id) : [...value, id]); }

  return <SafeAreaView style={styles.safe}><StatusBar style="dark" />
    <View style={styles.top}><Text style={styles.brand}>cosa <Text style={styles.brandAccent}>mangiamo?</Text></Text><Pressable onPress={useMyLocation} style={styles.location}><Text>⌖ {locationLabel}</Text></Pressable></View>
    <View style={styles.content}>
      {tab === 'scopri' && <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>Trova gli ingredienti{`\n`}per la tua Cina.</Text>
        <Text style={styles.lead}>Supermercati asiatici vicino a te, ingredienti verificati e ricette che riesci davvero a cucinare.</Text>
        <View style={styles.search}><Text>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Cerca un negozio, una città o un ingrediente" placeholderTextColor="#8C857B" style={styles.searchInput} /></View>
        <View style={styles.map}><View style={styles.mapRoad1}/><View style={styles.mapRoad2}/><Text style={styles.mapLabel}>Negozi asiatici vicino a te</Text>{filteredStores.map((store, index) => <Pressable key={store.id} onPress={() => selectStore(store)} style={[styles.pin, { left: `${20 + index * 27}%`, top: `${42 + (index % 2) * 22}%` }]}><Text>亚</Text></Pressable>)}</View>
        <View style={styles.rowTitle}><Text style={styles.h2}>Vicino a te</Text><Text style={styles.link}>Vedi mappa</Text></View>
        {filteredStores.map(store => <StoreCard key={store.id} store={store} onSelect={() => selectStore(store)} />)}
      </ScrollView>}
      {tab === 'ricette' && <ScrollView contentContainerStyle={styles.scroll}>
        {selectedStore ? <View style={styles.notice}><Text style={styles.noticeTitle}>Stai facendo la spesa da {selectedStore.name}</Text><Text style={styles.muted}>Abbiamo selezionato ricette in base a quello che vende.</Text><Pressable onPress={() => setSelectedStore(null)}><Text style={styles.link}>Cambia negozio</Text></Pressable></View> : <View style={styles.notice}><Text style={styles.noticeTitle}>Cosa hai già a casa?</Text><Text style={styles.muted}>Aggiungi ingredienti e trova la ricetta giusta.</Text></View>}
        <Text style={styles.h1}>Cucina cinese,{`\n`}passo dopo passo.</Text>
        <View style={styles.pantry}>{pantry.map(item => <Pressable key={item} onPress={() => setPantry(p => p.filter(x => x !== item))} style={styles.pantryChip}><Text>{item} ×</Text></Pressable>)}<Pressable onPress={() => setPantry(p => [...p, 'Cipollotto'])} style={styles.addChip}><Text>+ aggiungi</Text></Pressable></View>
        <Text style={styles.sectionCaption}>Ricette consigliate per te</Text>
        {recipes.map(recipe => <View key={recipe.id}><RecipeCard recipe={recipe} owned={owned(recipe)} onSelect={() => Alert.alert(recipe.title, `Apri il video di LINXIA e la lista della spesa per ${recipe.ingredients.filter(i => !pantry.includes(i)).join(', ')}.`)} /><Pressable onPress={() => toggleSave(recipe.id)} style={styles.save}><Text>{saved.includes(recipe.id) ? '♥ Salvata' : '♡ Salva ricetta'}</Text></Pressable></View>)}
      </ScrollView>}
      {tab === 'crea' && <ScrollView contentContainerStyle={styles.scroll}><Text style={styles.h1}>Condividi la tua{`\n`}cucina.</Text><Text style={styles.lead}>Carica un video verticale, aggiungi gli ingredienti e aiuta la community a cucinare cinese in Italia.</Text><Pressable style={styles.upload} onPress={() => Alert.alert('Video creator', 'Nella fase 2 collegheremo qui la libreria foto/video e la moderazione prima della pubblicazione.')}><Text style={styles.uploadIcon}>＋</Text><Text style={styles.uploadTitle}>Carica un video</Text><Text style={styles.muted}>9:16 · fino a 60 secondi</Text></Pressable><Text style={styles.h2}>Regole semplici</Text><Text style={styles.rule}>1. Mostra ingredienti acquistabili in Italia.</Text><Text style={styles.rule}>2. Indica tempi e quantità reali.</Text><Text style={styles.rule}>3. Niente link commerciali nel video.</Text></ScrollView>}
      {tab === 'profilo' && <ScrollView contentContainerStyle={styles.scroll}><View style={styles.avatar}><Text>LM</Text></View><Text style={styles.h1}>La mia cucina</Text><Text style={styles.lead}>Salvati, dispensa, video pubblicati e preferenze città.</Text><View style={styles.statRow}><View style={styles.stat}><Text style={styles.statNum}>{saved.length}</Text><Text style={styles.muted}>Ricette salvate</Text></View><View style={styles.stat}><Text style={styles.statNum}>{pantry.length}</Text><Text style={styles.muted}>In dispensa</Text></View></View><Pressable style={styles.setting}><Text>Gestisci città e notifiche</Text><Text>›</Text></Pressable><Pressable style={styles.setting}><Text>Diventa un creator</Text><Text>›</Text></Pressable></ScrollView>}
    </View>
    <View style={styles.nav}>{([['scopri','⌖','Scopri'], ['ricette','🥢','Ricette'], ['crea','＋','Crea'], ['profilo','◯','Profilo']] as const).map(([key, icon, label]) => <Pressable key={key} onPress={() => setTab(key)} style={styles.navItem}><Text style={[styles.navIcon, tab === key && styles.active]}>{icon}</Text><Text style={[styles.navLabel, tab === key && styles.active]}>{label}</Text></Pressable>)}</View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF8F3' }, top: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, backgroundColor: '#FAF8F3' }, brand: { fontSize: 27, fontWeight: '800', color: '#203F36', letterSpacing: -1 }, brandAccent: { color: '#E55C3D' }, location: { marginTop: 7, alignSelf: 'flex-start', backgroundColor: '#EEEAE1', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12 }, content: { flex: 1 }, scroll: { padding: 20, paddingBottom: 32 }, h1: { color: '#203F36', fontWeight: '800', fontSize: 32, letterSpacing: -1.3, lineHeight: 37 }, h2: { color: '#203F36', fontWeight: '800', fontSize: 20 }, lead: { color: '#655F57', fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 19 }, muted: { color: '#716B62', fontSize: 12, lineHeight: 17 }, link: { color: '#D9573C', fontWeight: '700', fontSize: 13 }, search: { height: 48, backgroundColor: '#FFF', borderColor: '#E5DED3', borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginBottom: 16 }, searchInput: { flex: 1, color: '#203F36', fontSize: 14 }, map: { height: 205, borderRadius: 22, backgroundColor: '#DCE8DD', overflow: 'hidden', position: 'relative', marginBottom: 22 }, mapRoad1: { position: 'absolute', height: 24, width: '125%', backgroundColor: '#F8F4EB', top: 83, left: -40, transform: [{ rotate: '-13deg' }] }, mapRoad2: { position: 'absolute', height: 18, width: '120%', backgroundColor: '#F8F4EB', top: 147, left: -20, transform: [{ rotate: '27deg' }] }, mapLabel: { position: 'absolute', top: 15, left: 16, color: '#31584B', fontWeight: '700' }, pin: { position: 'absolute', height: 37, width: 37, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#E55C3D', borderWidth: 3, borderColor: '#FFF8EF' }, rowTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }, storeCard: { backgroundColor: '#FFF', padding: 13, borderRadius: 17, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: '#ECE6DC' }, storeIcon: { width: 45, height: 45, borderRadius: 13, backgroundColor: '#1F5544', justifyContent: 'center', alignItems: 'center', marginRight: 11 }, storeIconText: { color: '#FFF', fontWeight: '800', fontSize: 21 }, storeInfo: { flex: 1 }, storeName: { color: '#203F36', fontWeight: '800', fontSize: 15, marginBottom: 2 }, open: { color: '#327C58', fontSize: 12, marginTop: 3, fontWeight: '600' }, rating: { color: '#A47523', fontWeight: '700', fontSize: 12 }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 }, tag: { backgroundColor: '#F2EEE5', fontSize: 10, paddingVertical: 3, paddingHorizontal: 6, borderRadius: 7, color: '#61594D' }, notice: { backgroundColor: '#EAF0E5', padding: 15, borderRadius: 16, marginBottom: 18 }, noticeTitle: { color: '#31584B', fontWeight: '800', marginBottom: 4 }, pantry: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 15, marginBottom: 24 }, pantryChip: { backgroundColor: '#FCE9D9', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 }, addChip: { borderColor: '#C9C3B9', borderWidth: 1, borderStyle: 'dashed', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 }, sectionCaption: { color: '#716B62', fontSize: 13, fontWeight: '700', marginBottom: 9 }, recipeCard: { backgroundColor: '#FFF', minHeight: 92, borderRadius: 17, padding: 10, borderWidth: 1, borderColor: '#ECE6DC', borderLeftWidth: 5, flexDirection: 'row' }, recipeArt: { width: 71, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 11 }, recipeEmoji: { fontSize: 30 }, recipeInfo: { flex: 1, justifyContent: 'center' }, recipeTitle: { color: '#203F36', fontWeight: '800', fontSize: 15, lineHeight: 20 }, recipeMeta: { color: '#796E63', fontSize: 11, marginTop: 6 }, save: { alignSelf: 'flex-end', marginTop: -26, marginRight: 11, marginBottom: 20, padding: 6 }, upload: { height: 215, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D4B69C', backgroundColor: '#FFF7EE', alignItems: 'center', justifyContent: 'center', marginVertical: 20 }, uploadIcon: { color: '#E55C3D', fontSize: 37, fontWeight: '300' }, uploadTitle: { color: '#203F36', fontWeight: '800', fontSize: 17, marginTop: 6 }, rule: { color: '#655F57', fontSize: 14, marginTop: 12 }, avatar: { height: 68, width: 68, backgroundColor: '#D5E5DA', borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }, statRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 24 }, stat: { flex: 1, padding: 15, backgroundColor: '#FFF', borderRadius: 15, borderColor: '#ECE6DC', borderWidth: 1 }, statNum: { color: '#203F36', fontSize: 26, fontWeight: '800' }, setting: { paddingVertical: 17, borderBottomColor: '#E6E0D6', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', color: '#203F36' }, nav: { backgroundColor: '#FFF', borderTopColor: '#E9E4DB', borderTopWidth: 1, height: 69, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 }, navItem: { minWidth: 58, alignItems: 'center' }, navIcon: { color: '#8F897F', fontSize: 18, fontWeight: '700' }, navLabel: { color: '#8F897F', fontSize: 10, marginTop: 3 }, active: { color: '#D9573C' }
});
