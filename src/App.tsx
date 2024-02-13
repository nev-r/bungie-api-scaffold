import { createHttpClient } from "@d2api/httpclient";
import "./App.css";
import { DefinitionsProvider, verbose, includeTables, loadDefs, setApiKey } from "@d2api/manifest-react";
import { getAllInventoryItemLiteDefs, getInventoryItemLiteDef, getSeasonDef, getStatDef } from "@d2api/manifest-web";
import {
  BungieMembershipType,
  DestinyCharacterResponse,
  DestinyComponentType,
  DestinyItemType,
  DestinyVendorResponse,
  getCharacter,
  getProfile,
  getVendor,
} from "bungie-api-ts/destiny2";
import { CoreSettingsConfiguration, getCommonSettings } from "bungie-api-ts/core";
import { useEffect, useState } from "react";
import { OAuthSetup, getLatestOAuth, getOAuthHttpClient } from "@d2api/oauth-react";
import { GeneralUser, getBungieNetUserById, getMembershipDataForCurrentUser } from "bungie-api-ts/user";
import { getApplicationApiUsage } from "bungie-api-ts/app";
// import { OAuthSetup } from "@d2api/d2oauth-react";

const { api_key, client_id, client_secret } = BUNGIE_APP_INFO;

// these initiate definitions download.
// they're at the top level of this file, not within the react structure,
// so that things start getting ready as soon as possible.
verbose();
includeTables(["InventoryItemLite", "Season", "Stat"]);
setApiKey(api_key);
// we're not awaiting this promise, just dispatching it to do its thing, while react builds the page
loadDefs();

function App() {
  const fallback = <b>hi, definitions are loading...</b>;

  return (
    <>
      <h2>you can see this sentence immediately</h2>
      <p>below this though, is the definitions-reliant area</p>
      {/* everything within DefinitionsProvider wrapper
          waits for defs to be available before rendering,
          otherwise get✕✕✕✕Def functions would fail.

          until then, it shows the fallback ↓ "loading" message */}
      <DefinitionsProvider fallback={fallback}>
        <h2>you can see this once the definitions load</h2>

        <h3>here, have a random weapon:</h3>
        <p>
          <D2Item />
        </p>

        <h3>here, have a specific weapon:</h3>
        <p>
          <D2Item itemHash={2575506895} />
        </p>

        <h2>let's hit a few API endpoints</h2>
        <h3>what season is it anyway?</h3>
        <p>
          <ThisSeason />
        </p>

        <h3>what's Platypie0803 up to?</h3>
        <p>
          <KineticEquipment />
        </p>
      </DefinitionsProvider>

      <h2>pssst wanna OAuth?</h2>
      <OAuthStuff />
    </>
  );
}

/** displays an item's icon+name, given its hash. if no item hash was provided, picks a random weapon. */
function D2Item({ itemHash }: { itemHash?: number }) {
  const allWeapons = getAllInventoryItemLiteDefs().filter((i) => i.itemType === DestinyItemType.Weapon);
  const aRandomWeapon = allWeapons[Math.floor(Math.random() * allWeapons.length)];

  const itemDef = itemHash ? getInventoryItemLiteDef(itemHash) : aRandomWeapon;
  const name = itemDef?.displayProperties.name;
  const icon = itemDef?.displayProperties.icon;

  return (
    <>
      <img height={32} width={32} src={"https://www.bungie.net" + icon} /> {name}
    </>
  );
}

// create an anonymous httpClient, (anonymous as in: no OAuth)
// which can be used with functions from bungie-api-ts (like getCommonSettings() below)
const httpClient = createHttpClient(api_key);

/** displays which destiny 2 season it is, according to bungie's global settings endpoint */
function ThisSeason() {
  const [coreSettings, setCoreSettings] = useState<CoreSettingsConfiguration | undefined>();
  useEffect(() => {
    getCommonSettings(httpClient).then((s) => setCoreSettings(s.Response));
  }, []);

  if (!coreSettings) return "still loading settings";
  const currentSeason = getSeasonDef(coreSettings.destiny2CoreSettings.currentSeasonHash);

  return `it's currently season ${currentSeason?.seasonNumber}: ${currentSeason?.displayProperties.name}`;
}

/**
 * gets some example information from Platypie0803's account and displays
 * what item the hunter has equipped in the kinetic slot right now
 *
 * the CharacterEquipment component shows equipped items, even if
 * someone has the majority of their inventory set to private.
 * so we can do this with an anonymous httpClient
 */
function KineticEquipment() {
  const [characterResponse, setCharacterResponse] = useState<DestinyCharacterResponse | undefined>();
  useEffect(() => {
    const getCharacterParams = {
      membershipType: BungieMembershipType.TigerXbox, // console players.........
      destinyMembershipId: "4611686018455948551", // Platypie0803
      characterId: "2305843009572044204",
      components: [DestinyComponentType.CharacterEquipment],
    };
    getCharacter(httpClient, getCharacterParams).then((s) => setCharacterResponse(s.Response));
  }, []);

  if (!characterResponse) return "still loading equipment";
  const kineticWeapon = characterResponse.equipment.data?.items.find((i) => i.bucketHash === 1498876634); // InventoryBucket [1498876634] "Kinetic Weapons"

  return (
    <>
      Platypie's hunter is currently holding a...
      <br />
      <D2Item itemHash={kineticWeapon?.itemHash} />
    </>
  );
}

/**
 * show oauth setup, then later, do some stuff that demonstrates we have working oauth
 */
function OAuthStuff() {
  const [completedAuthBnetUser, setCompletedAuthBnetUser] = useState("");

  if (!client_id)
    return (
      <>
        you'll need to set your app information in <code>vite.config.ts</code>
        <br />
        <a href="https://www.bungie.net/en/Application" target="_blank">
          set up or get that information here
        </a>
      </>
    );

  // this tells use whether there's currently a token loaded up and ready
  const latestAuthed = getLatestOAuth(client_id)?.token.membership_id;

  return (
    <>
      {/* unless we just completed auth, show information for performing auth */}
      {!completedAuthBnetUser ? (
        <>
          <h3>fyi:</h3>
          your <code>client_id</code> is <code>{client_id}</code>
          <br />
          your <code>api_key</code> is {api_key ? <code>{api_key}</code> : "missing"}
          <br />
          your <code>client_secret</code> is {client_secret ? <code>{client_secret}</code> : "missing"}
          <br />
          {(!api_key || !client_secret) && (
            <>
              <code>client_id</code> is all that's required to establish OAuth, but:
              <br />
              {!api_key && (
                <>
                  • <code>api_key</code> will be required to make API requests <i>using</i> OAuth
                  <br />
                </>
              )}
              {!client_secret && (
                <>
                  • without <code>client_secret</code>, OAuth expires after 1 hour
                  <br />
                  (longer requires a "Confidential" OAuth Client Type{" "}
                  <a href="https://www.bungie.net/en/Application" target="_blank">
                    here
                  </a>
                  )
                  <br />
                </>
              )}
            </>
          )}
          <br />
          {latestAuthed ? (
            <>
              you already have a token set up, but if you want, you can
              <br />
            </>
          ) : null}
          <OAuthSetup
            clientId={client_id}
            clientSecret={client_secret}
            warnUser
            verbose
            sideEffect={(str) =>
              setTimeout(() => {
                setCompletedAuthBnetUser(str);
              }, 10)
            }
          />
          <br />
        </>
      ) : (
        <>
          looks like OAuth flow was just completed for Bungie.net user {completedAuthBnetUser}
          <br />
          API reports that {completedAuthBnetUser} belongs to:{" "}
          <BungieName bnetMembershipId={completedAuthBnetUser} />
          <br />
        </>
      )}
      {latestAuthed && (
        <>
          <h3>so:</h3>
          {completedAuthBnetUser ? "also, " : ""}we recently acquired an OAuth token for Bungie.net user{" "}
          {latestAuthed}
          <br />
          API reports {latestAuthed} belongs to <BungieName bnetMembershipId={latestAuthed} />
          {completedAuthBnetUser && completedAuthBnetUser !== latestAuthed && (
            <>
              <br />
              weird that they don't match...
              <br />
            </>
          )}
          <h4>ok now, what's something we can only do as a logged-in user....</h4>
          <AuthenticatedTask />
        </>
      )}
    </>
  );
}

/** displays which destiny 2 season it is, according to bungie's global settings endpoint */
function BungieName({ bnetMembershipId }: { bnetMembershipId: string }) {
  const [bnetUser, setBnetUser] = useState<GeneralUser | undefined>();
  useEffect(() => {
    getBungieNetUserById(httpClient, { id: bnetMembershipId }).then((s) => setBnetUser(s.Response));
  }, [bnetMembershipId]);

  if (!bnetUser) return "loading user...";

  return `${bnetUser.cachedBungieGlobalDisplayName}#${bnetUser.cachedBungieGlobalDisplayNameCode}`;
}

/** do some stuff that demonstrates we have working oauth */
function AuthenticatedTask() {
  const latestAuthed = getLatestOAuth(client_id)!.token.membership_id!;
  const authedClient = getOAuthHttpClient(api_key, client_id, client_secret, latestAuthed, { verbose: true });

  // we'll store a string if there's an error. again, a little silly, just doing this for fewer lines of code.
  const [vendorResponse, setVendorResponse] = useState<DestinyVendorResponse | undefined>();
  useEffect(() => {
    (async () => {
      // we know who we are (the Bungie.net user this OAuth is for (latestAuthed)) but we haven't looked up who we are in Destiny 2
      const membershipInfo = (await getMembershipDataForCurrentUser(authedClient)).Response;
      getApplicationApiUsage(authedClient, { applicationId: 16281 });
      // a single bnet account have have multiple attached destiny accounts. this is the id of the main cross-saved one.
      const primaryId = membershipInfo.primaryMembershipId;
      // using a few !s to make assumptions. don't log into a bnet account with no destiny profile :)
      const primaryMembership = membershipInfo.destinyMemberships.find((m) => m.membershipId === primaryId)!;

      // a destiny account has an id, and a type (platform)
      const { membershipId, membershipType } = primaryMembership;

      // getProfile is the main endpoint: inventory, triumphs, characters, everything's here.
      // which components you request, determines which information will be sent back
      const profileResponse = (
        await getProfile(httpClient, {
          destinyMembershipId: membershipId,
          membershipType: membershipType,
          components: [DestinyComponentType.Profiles], // here, we ask for the most basic component
        })
      ).Response;
      // the goal here is simply to find the ID of one of our characters, so we can make a vendor call
      // pick the first char in the list
      const characterId = profileResponse.profile.data!.characterIds[0];

      // getVendor only works with user authentication. you can't check someone else's vendors
      const fetchedVendorResponse = (
        await getVendor(authedClient, {
          vendorHash: 350061650, // let's check on ada-1's armor
          characterId,
          membershipType,
          destinyMembershipId: membershipId,
          // we'll find out what she's selling, and what the stats are for any items she sells
          components: [DestinyComponentType.VendorSales, DestinyComponentType.ItemStats],
        })
      ).Response;

      // now that we got the API data we wanted, store it in this component's state
      setVendorResponse(fetchedVendorResponse);
    })();
  }, [authedClient]);

  if (!vendorResponse) return "loading account and vendor info...";

  // let's find a piece of armor that our favorite exo offers
  const aPieceOfArmor = Object.values(vendorResponse.sales.data!).find((sale) => {
    // a sale item has very little information about the item itself, mostly the sale.
    // we'll use the item's definition for a fuller picture of it
    const itemDef = getInventoryItemLiteDef(sale.itemHash);
    // check its ItemType and stop searching when we find an armor
    return itemDef?.itemType === DestinyItemType.Armor;
  });

  if (!aPieceOfArmor) return "hmm. is ada-1 not selling any armor?";

  // vendor sales, components, etc, are in dictionaries, keyed by vendorItemIndex
  // their property structure is a little silly and redundant, as you can see from the below path.
  const armorStats = vendorResponse.itemComponents.stats.data![aPieceOfArmor.vendorItemIndex].stats!;
  // this ^ is a dictionary of stat information, keyed by stat hash.

  const armorDef = getInventoryItemLiteDef(aPieceOfArmor.itemHash)!;
  return (
    <>
      ada-1 is selling a{" "}
      <b>
        {armorDef.displayProperties.name} ({armorDef.itemTypeDisplayName})
      </b>
      <ul>
        {Object.values(armorStats).map((s) => {
          const statDef = getStatDef(s.statHash)!;
          const statName = statDef.displayProperties.name;
          return (
            <li key={s.statHash}>
              {statName}: {s.value}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default App;
