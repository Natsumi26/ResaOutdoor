--
-- PostgreSQL database dump
--

\restrict yPrsrNO5kTFjyMPXUUoTkkjedZj9NPZ7pw60gk2LBnroyqtgDsssPMnlLHzcpWs

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2025-12-09 09:12:22

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 34573)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 5204 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 34574)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 50961)
-- Name: activity_form_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_form_configs (
    id text NOT NULL,
    "activityTypeId" text NOT NULL,
    "userId" text NOT NULL,
    fields jsonb NOT NULL,
    "wetsuitBrand" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.activity_form_configs OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 34688)
-- Name: booking_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_history (
    id text NOT NULL,
    action text NOT NULL,
    details text,
    "bookingId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.booking_history OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 34856)
-- Name: booking_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_notes (
    id text NOT NULL,
    content text NOT NULL,
    "bookingId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.booking_notes OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 34653)
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id text NOT NULL,
    "clientFirstName" text NOT NULL,
    "clientLastName" text NOT NULL,
    "clientEmail" text NOT NULL,
    "clientPhone" text NOT NULL,
    "clientNationality" text,
    "numberOfPeople" integer NOT NULL,
    "totalPrice" double precision NOT NULL,
    "amountPaid" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "sessionId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "productId" text NOT NULL,
    "participantsFormCompleted" boolean DEFAULT false NOT NULL,
    "productDetailsSent" boolean DEFAULT false NOT NULL,
    "resellerId" text,
    "discountAmount" double precision,
    "voucherCode" text,
    "cancellationReason" text,
    "cancelledAt" timestamp(3) without time zone
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 34603)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 34891)
-- Name: email_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_templates (
    id text NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    "htmlContent" text NOT NULL,
    "textContent" text,
    variables text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "userId" text
);


ALTER TABLE public.email_templates OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 46371)
-- Name: equipment_lists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipment_lists (
    id text NOT NULL,
    name text NOT NULL,
    items text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.equipment_lists OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 34700)
-- Name: gift_vouchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gift_vouchers (
    id text NOT NULL,
    code text NOT NULL,
    amount double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    type text DEFAULT 'voucher'::text NOT NULL,
    "maxUsages" integer,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "discountType" text DEFAULT 'fixed'::text NOT NULL,
    notes text,
    "userId" text NOT NULL,
    "buyerEmail" text,
    message text,
    "recipientEmail" text,
    "recipientName" text
);


ALTER TABLE public.gift_vouchers OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 34928)
-- Name: newsletter; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.newsletter (
    id text NOT NULL,
    email text NOT NULL,
    "acceptedTerms" boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "firstName" text,
    "lastName" text,
    source text,
    "subscribedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "unsubscribedAt" timestamp(3) without time zone,
    "userId" text
);


ALTER TABLE public.newsletter OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 34807)
-- Name: participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.participants (
    id text NOT NULL,
    "firstName" text NOT NULL,
    age integer,
    height integer,
    weight double precision,
    "wetsuitSize" text,
    "shoeRental" boolean DEFAULT false NOT NULL,
    "shoeSize" integer,
    "bookingId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isComplete" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.participants OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 48930)
-- Name: password_resets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_resets (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    used boolean DEFAULT false NOT NULL
);


ALTER TABLE public.password_resets OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 34675)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id text NOT NULL,
    amount double precision NOT NULL,
    method text NOT NULL,
    "stripeId" text,
    notes text,
    "bookingId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "discountAmount" double precision,
    "voucherCode" text
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 34782)
-- Name: product_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_categories (
    id text NOT NULL,
    "productId" text NOT NULL,
    "categoryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.product_categories OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 34615)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id text NOT NULL,
    name text NOT NULL,
    "shortDescription" text,
    "longDescription" text,
    "priceIndividual" double precision NOT NULL,
    "priceGroup" jsonb,
    duration integer NOT NULL,
    color text NOT NULL,
    level text NOT NULL,
    "maxCapacity" integer NOT NULL,
    "autoCloseHoursBefore" integer,
    "postBookingMessage" text,
    "wazeLink" text,
    "googleMapsLink" text,
    images text[],
    "guideId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    region text DEFAULT 'annecy'::text NOT NULL,
    "websiteLink" text,
    "activityTypeId" text NOT NULL,
    "equipmentListId" text,
    "meetingPoint" text
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 34834)
-- Name: promo_code_usages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_code_usages (
    id text NOT NULL,
    "voucherId" text NOT NULL,
    "usedBy" text,
    "bookingId" text,
    "usedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.promo_code_usages OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 34874)
-- Name: resellers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resellers (
    id text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    commission double precision,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    website text,
    "userId" text NOT NULL
);


ALTER TABLE public.resellers OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 34752)
-- Name: session_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session_products (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    "productId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "productOverrides" jsonb
);


ALTER TABLE public.session_products OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 34634)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "timeSlot" text NOT NULL,
    "startTime" text NOT NULL,
    "isMagicRotation" boolean DEFAULT false NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    "guideId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "shoeRentalAvailable" boolean DEFAULT false NOT NULL,
    "shoeRentalPrice" double precision
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 34911)
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id text NOT NULL,
    "companyName" text,
    "companyPhone" text,
    "companyEmail" text,
    logo text,
    "primaryColor" text,
    "secondaryColor" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientAccentColor" text,
    "clientButtonColor" text,
    slogan text,
    website text,
    "userId" text NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 48964)
-- Name: trusted_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trusted_devices (
    id text NOT NULL,
    "userId" text NOT NULL,
    "deviceName" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastUsedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    jti text,
    revoked boolean DEFAULT false NOT NULL
);


ALTER TABLE public.trusted_devices OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 48945)
-- Name: two_factor_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.two_factor_codes (
    id text NOT NULL,
    "userId" text NOT NULL,
    code text NOT NULL,
    email text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "tempToken" text NOT NULL
);


ALTER TABLE public.two_factor_codes OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 34588)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    login text NOT NULL,
    password text NOT NULL,
    email text,
    "stripeAccount" text,
    role text DEFAULT 'employee'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "confidentialityPolicy" text,
    "depositAmount" double precision,
    "depositType" text,
    "paymentMode" text DEFAULT 'onsite_only'::text,
    "practiceActivities" text[],
    "teamLeaderId" text,
    "teamName" text,
    phone text,
    "twoFactorEnabled" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5176 (class 0 OID 34574)
-- Dependencies: 219
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
fe481f12-d44f-4cec-8eef-8aacce272337	31ab45d5859fd5a7f1702333bb4dd7163271fb73dd14a7f5f3b8bc7c0bdf722a	2025-11-03 08:57:56.401303+01	20251006132002_first	\N	\N	2025-11-03 08:57:56.356847+01	1
2edc1d53-a48a-4394-ab86-4b02ae55d1f1	11ff0c06895cef391e57832e5f3061833156d8a0d5368a9758b1db5bd41bbf63	2025-11-03 08:57:56.481864+01	20251022130240_participant_is_complete	\N	\N	2025-11-03 08:57:56.479188+01	1
fa36ba63-b6e3-42e5-b1dd-f200f0fd0dcb	74369858e902b65c7baad0ce26df880779b2f1d74f2a33eddc522b5d60186175	2025-11-03 08:57:56.413375+01	20251007084440_refactor_session_booking_system	\N	\N	2025-11-03 08:57:56.401945+01	1
b8e42e2b-6f70-44dc-afc9-dfbd0d7243d1	5fa2c2f355f1e7b39b945c4e68f2894413af4bab8d5c87f895679783619e1ad3	2025-11-03 08:57:56.41595+01	20251010091942_add_region_to_products	\N	\N	2025-11-03 08:57:56.413856+01	1
3cf5f802-930c-4638-ab2c-e795d8b00718	8f9d7f0a6414a38900e5324fa64e7287f4df58a320da8c05ae21e9692c501356	\N	20251104092508_update_settings_per_user	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251104092508_update_settings_per_user\n\nDatabase error code: 42701\n\nDatabase error:\nERREUR: la colonne « userId » de la relation « settings » existe déjà\n\nDbError { severity: "ERREUR", parsed_severity: Some(Error), code: SqlState(E42701), message: "la colonne « userId » de la relation « settings » existe déjà", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7679), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251104092508_update_settings_per_user"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251104092508_update_settings_per_user"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-11-06 11:06:58.36509+01	2025-11-06 11:04:24.86296+01	0
ad67e73b-1a88-4bd0-9bb4-43cf78680392	164c370b5ab6ad1a9d9abffc4d5ebbaf383d5505b7a677b51c6f56c9102635d1	2025-11-03 08:57:56.424957+01	20251013083126_add_product_categories_and_website_link	\N	\N	2025-11-03 08:57:56.416499+01	1
333a7480-c65a-4542-896f-1a616b8cf221	e22ba3718f930c80c6d7f9c4ffa00ced6e4444a6770a677f45bc982c3bd9cb44	2025-11-03 08:57:56.484815+01	20251023070853_add_voucher_tracking_to_bookings_and_payments	\N	\N	2025-11-03 08:57:56.482676+01	1
834583ff-a980-4e88-a427-a756f6365d67	7909519d9da78771ee0ce78772de3bdf61cadc4406a8968b136a766e45e724c2	2025-11-03 08:57:56.434482+01	20251013095339_add_participants_and_shoe_rental	\N	\N	2025-11-03 08:57:56.42553+01	1
427aca2a-acb4-4527-b343-c27e7fd22434	9a4b8461403b73db538a01f4e5c1a9f92d4b7e9d9fd13f4b62272b58f5dfdb48	2025-11-03 08:57:56.437638+01	20251014072046_add_booking_completion_status	\N	\N	2025-11-03 08:57:56.435014+01	1
31f5ade0-6717-43cd-a013-6864b87af171	8f9d7f0a6414a38900e5324fa64e7287f4df58a320da8c05ae21e9692c501356	2025-11-06 11:06:58.367+01	20251104092508_update_settings_per_user		\N	2025-11-06 11:06:58.367+01	0
8539464c-c02a-42f6-ad11-1204773cc90b	1993e3f4124fde48abbd7fad9467c8f306f4a2b3d61486e9518b588afc3cdb98	2025-11-03 08:57:56.446676+01	20251014081940_add_promo_code_usages	\N	\N	2025-11-03 08:57:56.438187+01	1
856603f1-6bb8-477e-a296-5d1228bb7de0	5545d290846622a1960a5bc05c3156ca38abb7c688b5c380dcf8b340f71241ce	2025-11-03 08:57:56.48687+01	20251024080839_add_cancellation_fields	\N	\N	2025-11-03 08:57:56.485299+01	1
d89eaac5-2809-4fe0-88a6-49e012eba369	3ae0ddfb80eb669d48b3d80eebffd49d638b578bee061149457619401d83ed2b	2025-11-03 08:57:56.450722+01	20251014093158_add_discount_type_to_vouchers	\N	\N	2025-11-03 08:57:56.447706+01	1
46a8d0ca-a399-4eef-9d50-a0716bfc7825	631e845665a30102df9aeb76e66b413b17fe358f591eb50071326e054018b5a4	2025-11-03 08:57:56.45787+01	20251017170832_add_booking_notes	\N	\N	2025-11-03 08:57:56.451253+01	1
cffb51b4-9dc6-4902-963d-c66fb40cd2d6	642e03a1951400bba347911b55753f12aa356d7cf94fd6f9db290524018be389	2025-11-14 08:47:43.090022+01	20251114074743_add_product_overrides	\N	\N	2025-11-14 08:47:43.076173+01	1
c6215fde-e45a-42e7-b77f-56924a59ab06	7afacbf820562a187fcb57976866d699adf044385da22d3beaa2306d8d141cb2	2025-11-03 08:57:56.466291+01	20251018091030_add_resellers	\N	\N	2025-11-03 08:57:56.458253+01	1
35f1f58f-b7f5-44f6-8561-92db4976b5d4	7e59880ee57fde7840e914cd1e4a8dc356ba62fe05cebc46bccab9e8aee9bc56	2025-11-03 08:57:56.491352+01	20251025160948_add_settings_table	\N	\N	2025-11-03 08:57:56.487301+01	1
0c636ffa-8569-4aa9-a2ef-d397f3492d5c	4daa995162e9a0418e26fb75217354559b3e15b3bad555163a9ec34529db1cbc	2025-11-03 08:57:56.468816+01	20251018093119_add_reseller_website	\N	\N	2025-11-03 08:57:56.466859+01	1
48130ed0-a40d-4e47-af6a-4231069e2791	777c15621fdd68f5acbb69c01f3ad99671c5113da7da276803058faf6e6e4148	2025-11-03 08:57:56.475258+01	20251020142114_add_notes_to_gift_voucher	\N	\N	2025-11-03 08:57:56.469251+01	1
c8ab953a-ea4b-477b-a6f6-c1b56cbc2bb2	765d73ae5d4f9dbf360462dbc45c925684f4bf7c1c287b8fdc8c32ba8820719e	2025-11-06 11:07:08.53495+01	20251106100708_add_buyer_email_gift_voucher	\N	\N	2025-11-06 11:07:08.528074+01	1
b2a80c04-cbb4-4cc4-9740-b61f5285be43	42648e767dbc90f8cef0881098916c3af6e291883dd01ffdcb9f69cc994e7507	2025-11-03 08:57:56.478583+01	20251022125907_make_participant_fields_optional	\N	\N	2025-11-03 08:57:56.475701+01	1
a139778f-6721-4fda-90b8-e839ef0361ee	b876399ccb93fa1c449fe6a014714b6c8c3abfeb02396c737873b8ac506a4084	2025-11-03 08:57:56.508675+01	20251102145638_add_practice_activities	\N	\N	2025-11-03 08:57:56.491814+01	1
8b7bee8c-3274-46c7-a115-6a9b750bf2b1	679d5fbbf40c37e79ab7a9cc8e642cab5c9713359cc96608e54edb671e2e27f3	2025-11-03 08:57:56.51316+01	20251102151744_add_activity_type_to_products	\N	\N	2025-11-03 08:57:56.509198+01	1
56c1d909-5002-4377-ab64-1f4fd6a8519b	2b9e34f07da9ab91b066d7df49b9ae1d88b1c3f2965d451fae07cc09f724c20a	2025-11-12 14:52:48.872803+01	20251112135248_add_equipment_lists	\N	\N	2025-11-12 14:52:48.802164+01	1
66692064-4324-4f16-85c8-d2ab828a50ad	927ebef2f59cf8a754058763a0d385cb82718f80b185cff8142d86ab160f392b	2025-11-03 08:57:56.516785+01	20251102155155_remove_activity_type_relation	\N	\N	2025-11-03 08:57:56.513801+01	1
bd7937e9-10a2-4bfb-bbf7-47afb36097ea	f3e2e7670c2320ebb2f71360d6967c3c0b4070302b04fe72ead85c55cdb82f95	2025-11-06 11:19:47.518518+01	20251106101947_add_recipient_gift_voucher	\N	\N	2025-11-06 11:19:47.513843+01	1
b638b566-ac2a-4867-aaac-32cf325ad419	122d743a0403e77ad7e0ed9447f5b8826f2fbdbc55612d936eff004dd13c2eec	2025-11-03 08:59:54.827901+01	20251103075940_20251103085850_migration_maj_bdd	\N	\N	2025-11-03 08:59:54.826121+01	1
f83bf8e2-b895-4a0b-8a90-b1f134ee0ea6	0d90097faa70ee1f3f73e34a6b9fa0b78acad92f464c17ab8c6683e286ecb0de	2025-11-14 09:26:55.643417+01	20251114082655_add_phone_to_user	\N	\N	2025-11-14 09:26:55.636757+01	1
aaf4192a-e313-4eb0-9ed2-a2ae34fe71e3	a837ae686af33b4df522b315d7d2737e5f971bd92d8d1fdd6ab787db8bf8a2b8	2025-11-17 13:54:45.068023+01	20251117125445_add_modification_2factor	\N	\N	2025-11-17 13:54:45.019819+01	1
cf70342c-35c5-442c-a5ca-b2f3ecc29ac7	344f40a4c52dc953b895c8e60bf41858fe7cf9afa3411270a227a8fdfdd8fd55	2025-11-20 10:41:29.843429+01	20251120094129_add_form_activity	\N	\N	2025-11-20 10:41:29.79797+01	1
1e9e40ee-5399-479c-8a89-98b9dec96561	9a6dc5a56ad19e8f2ad8d185216b288b96c90a3f426e81e2bed3523fa68b010b	2025-12-04 08:49:03.472002+01	20251204074903_add_jti_optional	\N	\N	2025-12-04 08:49:03.432263+01	1
\.


--
-- TOC entry 5198 (class 0 OID 50961)
-- Dependencies: 241
-- Data for Name: activity_form_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_form_configs (id, "activityTypeId", "userId", fields, "wetsuitBrand", "createdAt", "updatedAt") FROM stdin;
2e491c88-642a-42b6-a5ce-52981d0e5686	via-ferrata	087af464-83ec-4800-b868-4280e7a42577	{"age": {"enabled": true, "required": true}, "height": {"enabled": true, "required": false}, "weight": {"enabled": true, "required": false}, "shoeSize": {"enabled": false, "required": false}, "firstName": {"enabled": true, "required": true}, "shoeRental": {"enabled": false, "required": false}}	\N	2025-11-24 11:41:17.641	2025-11-24 11:41:17.641
\.


--
-- TOC entry 5183 (class 0 OID 34688)
-- Dependencies: 226
-- Data for Name: booking_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booking_history (id, action, details, "bookingId", "createdAt") FROM stdin;
328a5290-bdb9-4fd8-a7e2-c536b69e206e	created	Réservation créée pour 1 personne(s) - Canyon du Furon	61408a2a-1459-49d5-83fc-626d5d830d98	2025-11-03 12:30:48.008
221de742-c751-45c2-ac64-f4994f9c8f6d	modified	Formulaire participants complété (1 participant(s))	61408a2a-1459-49d5-83fc-626d5d830d98	2025-11-03 12:30:48.061
a05220c9-6d22-4d1b-9c1d-b78fe588dd81	modified	Formulaire participants complété (1 participant(s))	61408a2a-1459-49d5-83fc-626d5d830d98	2025-11-03 12:31:15.155
8cac96b4-a19d-49ea-aea7-49c440097eae	modified	Réservation modifiée	61408a2a-1459-49d5-83fc-626d5d830d98	2025-11-03 12:31:15.174
7de4b941-596b-4413-bcd5-42308903e03b	modified	Réservation modifiée	61408a2a-1459-49d5-83fc-626d5d830d98	2025-11-04 08:19:11.012
6b8d1709-ad6f-4920-9556-c8833e97d225	created	Réservation créée pour 2 personne(s) - L'Infernet | Code cadeau 70C3RZDRTA appliqué (-30.00€)	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-04 09:08:58.742
86dd12a5-73c5-41c7-b0f2-0349076f9c34	promo_applied	Code cadeau 70C3RZDRTA appliqué - Réduction de 30.00€	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-04 09:08:58.754
68d05a2e-1d32-4603-91e1-2a4a5fb3998d	modified	Formulaire participants complété (2 participant(s))	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-04 09:08:58.804
f8eea229-0944-4d44-a528-b139f79bb1f0	modified	Formulaire participants complété (2 participant(s))	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-04 09:09:35.494
01392686-47be-442d-94cd-bea1d5e12f1a	modified	Réservation modifiée	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-04 09:09:35.514
d855d4a3-3c7f-4dd7-af75-17bc17f68b9b	created	Réservation créée avec paiement Stripe de 5€	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-04 09:43:44.758
374c7853-5894-42d8-b8a5-c23a47bd3a05	modified	Réservation déplacée de la session du 05/11/2025 à 09:00 vers la session du 08/11/2025 à 09:00	61408a2a-1459-49d5-83fc-626d5d830d98	2025-11-04 15:43:08.927
5d8c848a-f4a4-49eb-ade2-ffd5a9d4e33a	modified	Réservation modifiée	61408a2a-1459-49d5-83fc-626d5d830d98	2025-11-05 07:18:03.542
14cc538a-7350-4875-987d-4d2d311b2eff	created	Réservation créée pour 3 personne(s) - Canyon du Versoud	3b10d4ae-d9e5-4718-8ff1-326f03191a29	2025-11-05 07:19:07.571
cb09ef0b-f9dd-4011-a0f1-9801e443abb1	modified	Réservation déplacée de la session du 08/11/2025 à 09:00 vers la session du 09/11/2025 à 09:00	61408a2a-1459-49d5-83fc-626d5d830d98	2025-11-05 07:25:41.124
c14272c7-be2c-4df5-9b47-d4f3073bbaaa	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Furon" vers "Canyon du Versoud". Prix mis à jour: 300€	61408a2a-1459-49d5-83fc-626d5d830d98	2025-11-05 07:26:30.101
87618f71-f792-411d-bcf0-8f6300fb648d	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (L'Infernet) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 08:43:16.494
eb1c0973-184b-4ecf-afe2-c5fd57e047ad	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (L'Infernet) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 08:43:16.503
41c874cb-6dda-4244-96c5-9d7306668de8	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "Canyon des Ecouges 2". Prix mis à jour: 120€	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 08:45:12.284
24051cfa-ee01-4582-bb36-c4f1eae5c519	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "Canyon des Ecouges 2". Prix mis à jour: 60€	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 08:45:18.425
d8c91e3b-a697-4ad5-9448-513799496264	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (Canyon des Ecouges 2) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 08:45:46.448
39c71d0f-e7a6-4c37-8bab-338c234c920b	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (Canyon des Ecouges 2) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 08:45:46.477
a384cbcd-16f9-46b0-b4d7-f72ba715da3e	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "Canyon des Ecouges 2". Prix mis à jour: 120€	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 08:46:26.887
7238f97a-90d0-4dc7-b5b4-9d396259b193	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "Canyon des Ecouges 2". Prix mis à jour: 60€	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 08:46:31.99
c2eb6406-3441-4f62-aefd-14a7b6570a93	modified	Réservation déplacée vers une nouvelle session	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 08:46:41.184
591ece36-bfe3-468f-9506-cb2106611856	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (Canyon des Ecouges 2) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 08:54:41.653
b63edc62-252a-4dcd-b807-3d1b6e14a0e3	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (Canyon des Ecouges 2) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 08:54:41.671
d444ab87-43fa-42c4-9d03-fc5cecd3e461	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "L'Infernet". Prix mis à jour: 110€	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 08:59:16.72
a565cf97-5f54-4e80-87bd-010cb3751fe5	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "L'Infernet". Prix mis à jour: 55€	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 08:59:25.182
63082019-f0e3-421b-9f12-2a951c3d3233	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (L'Infernet) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 08:59:42.226
293cf768-75da-4635-a393-5944a2d14d5e	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (L'Infernet) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 08:59:42.246
cd74f1fa-d303-422c-90dc-687cf41c45a3	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "L'Infernet". Prix mis à jour: 110€	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 09:03:17.814
d51cb568-ab0d-4d6a-92bf-73fe947b058d	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "L'Infernet". Prix mis à jour: 55€	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 09:03:26.759
64e8a0b0-c77a-4d49-8398-c9eeb2148273	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (L'Infernet) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 09:03:41.167
4d2187fc-6ccb-4aaf-9cfe-827cdc2426c4	created	Réservation créée avec paiement Stripe (Payment Element) de 60€	835c551e-c821-4bba-86d4-b72dd8911ba9	2025-12-03 12:17:05.256
b110b8cc-42af-4f6d-b4e1-16ce193befd6	created	Réservation créée avec paiement Stripe (Payment Element) de 60€	4fa84797-cd41-4ad2-b030-534cb964ee02	2025-12-04 16:00:51.657
181fa14f-1423-41ba-99bf-44e62cf0e5f6	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (L'Infernet) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 09:03:41.173
a5afe548-d6b2-4ea6-9d7b-289508e940b7	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "L'Infernet". Prix mis à jour: 110€	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 09:11:06.092
71a4f801-8317-4ab6-9ebe-ef7bd8fa7ac5	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "L'Infernet". Prix mis à jour: 55€	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 09:11:12.511
714d8f3c-7f17-4a11-a417-cb4338934a1d	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (L'Infernet) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 09:11:20.985
94b71180-79bc-45a8-a16f-d04ef466dc21	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (L'Infernet) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 09:11:20.991
ba3e2539-f5b0-41b2-9d47-96570743a34c	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "Canyon du Furon". Prix mis à jour: 100€	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 09:13:48.248
88c6c706-0565-46ac-a46f-11ad6448de7d	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "Canyon du Furon". Prix mis à jour: 50€	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 09:13:59.747
c6edfeb4-e6d8-4c95-b30a-27394bc93875	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (Canyon du Furon) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 09:14:06.063
5a772d89-67e6-4d32-a489-3739cbeeabbd	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (Canyon du Furon) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 09:14:06.078
7bae0589-b28d-411d-8536-f40140104d0d	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "Canyon du Furon". Prix mis à jour: 100€	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 09:14:33.636
88c4de76-746c-41e2-8982-454fdf0fe438	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "Canyon du Furon". Prix mis à jour: 50€	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 09:14:38.606
f480b043-5e69-46ec-a9a0-d8b5e11d0423	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (Canyon du Furon) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-05 09:14:47.049
9cebb519-13b5-4d05-9dcb-77410a7799c2	modified	Réservation déplacée de la session du 06/11/2025 à 09:00 (Canyon du Furon) vers la session du 09/11/2025 à 09:00 (Canyon du Versoud)	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-05 09:14:47.057
3a301b3e-5d5a-4095-85fb-84ccb7151ce4	created	Réservation créée avec paiement Stripe (Payment Element) de 15€	9e3a174e-2db5-4414-854c-d65cf0007a4f	2025-11-06 08:56:26.991
e8984efc-38e0-4320-8e40-0292ce509ad1	created	Réservation créée pour 1 personne(s) - Canyon du Versoud	9b4719cf-784d-4ea6-8359-cb2d8a4cb9f4	2025-11-06 09:09:02.256
1fa415d9-c4b6-4286-9c08-f1c1601d6170	modified	Formulaire participants complété (1 participant(s))	9b4719cf-784d-4ea6-8359-cb2d8a4cb9f4	2025-11-06 09:09:02.306
f11c2849-c561-48f9-b7c2-e988e13c5c38	modified	Formulaire participants complété (1 participant(s))	9b4719cf-784d-4ea6-8359-cb2d8a4cb9f4	2025-11-06 09:09:24.613
68d75f56-52f2-48c2-ab49-af06090b24d2	created	Réservation créée pour 1 personne(s) - Canyon du Versoud	4ce6c4f6-6458-4060-9cde-47beb9395ada	2025-11-07 09:47:41.362
ee43bef4-94bc-4ae1-b72e-86896b979244	modified	Formulaire participants complété (1 participant(s))	4ce6c4f6-6458-4060-9cde-47beb9395ada	2025-11-07 09:47:41.412
44c9d975-056a-4305-ba65-1324ca0216e9	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon du Versoud" vers "L'Infernet". Prix mis à jour: 55€	4ce6c4f6-6458-4060-9cde-47beb9395ada	2025-11-08 16:09:16.387
99944466-1528-4570-8c24-a77dec470e3b	created	Réservation créée avec paiement Stripe (Payment Element) de 60€	f33027cb-faf1-4811-97d0-a2b0f64990e1	2025-11-12 07:07:07.193
dd2904a4-6547-4a3a-860e-5c616ad1a8ec	modified	Formulaire participants complété (1 participant(s))	f33027cb-faf1-4811-97d0-a2b0f64990e1	2025-11-12 07:26:31.82
472dda28-9abe-4299-b283-6f1b4bb03444	created	Réservation créée avec paiement Stripe (Payment Element) de 50€	5efdef38-a2d4-46e2-a883-1f8384484c6b	2025-11-13 07:28:07.876
74b2ee0e-f08c-4259-aa0e-1989625dd479	created	Réservation créée avec paiement Stripe (Payment Element) de 50€	c90c492b-af06-48fc-bc68-cee7afee6f62	2025-11-13 08:24:42.691
c6bb107f-d843-4772-a5f2-91f8c39ca0b8	created	Réservation créée avec paiement Stripe (Payment Element) de 50€	bf28641d-7682-44d9-a2db-a0c6894756e8	2025-11-13 08:48:55.206
f746f613-69ad-49cb-aaee-0703e4da6a5f	created	Réservation créée avec paiement Stripe (Payment Element) de 50€	5820e61e-6193-47f9-bffd-55ee2ac2aba0	2025-11-13 08:55:41.043
d2c4cd67-825e-4c18-b341-8277ef91b2aa	created	Réservation créée avec paiement Stripe (Payment Element) de 50€	fefaab47-733f-4dbc-bae4-24ec1d69bd3d	2025-11-13 09:00:56.444
217bd766-0a41-4281-8b1f-4b04f22a40f5	created	Réservation créée avec paiement Stripe (Payment Element) de 50€	c7fcd753-a8d6-46fc-900c-b4c2d9404bae	2025-11-13 09:05:19.181
e828870f-8ce7-4c6a-9f72-69528094cdb3	modified	Formulaire participants complété (1 participant(s))	c7fcd753-a8d6-46fc-900c-b4c2d9404bae	2025-11-13 09:20:47.226
c22d48f2-8a4b-471b-952c-b33304c1d455	modified	Réservation modifiée	c7fcd753-a8d6-46fc-900c-b4c2d9404bae	2025-11-13 09:20:47.252
0adfebb4-b447-40b5-8b22-a05f332c60bc	created	Réservation créée avec paiement Stripe (Payment Element) de 50€	201993a6-f16c-41a7-9505-c2166e90e4a4	2025-11-20 12:20:30.797
453295da-2b55-4065-8679-40a19f88cdca	modified	Réservation déplacée vers une nouvelle session. Produit changé de "Canyon de Terneze" vers "Canyon du Furon". Prix mis à jour: 50€	c90c492b-af06-48fc-bc68-cee7afee6f62	2025-11-25 13:37:54.961
4ab30846-b4e1-4c8d-a367-be981532316a	created	Réservation créée pour 1 personne(s) - Canyon de Terneze	146de3e4-4e3e-475d-a9f6-d5d52f468d47	2025-11-25 13:51:25.782
9f59871f-736e-49b0-807e-126b07bbdffa	modified	Formulaire participants complété (1 participant(s))	146de3e4-4e3e-475d-a9f6-d5d52f468d47	2025-11-25 13:51:25.836
214d0f92-fc88-4e09-b3dd-c37e581fea31	modified	Formulaire participants complété (1 participant(s))	146de3e4-4e3e-475d-a9f6-d5d52f468d47	2025-11-25 13:52:22.576
67094b11-4abc-4408-8afd-6f4896af5eb6	created	Réservation créée pour 1 personne(s) - Canyon des Ecouges 2	d05c86ed-7397-4a3e-9d9d-f70d3faa04e8	2025-12-02 14:59:08.237
30064595-5f44-48bf-bdca-dbc69e1249a2	modified	Formulaire participants complété (1 participant(s))	d05c86ed-7397-4a3e-9d9d-f70d3faa04e8	2025-12-02 14:59:08.288
4f4fa5fe-288c-4fbd-a9d1-0a8d1d9b38b2	created	Réservation créée pour 1 personne(s) - Canyon de Terneze	9e15b4c8-7ec2-4506-8f87-cd3d7171af81	2025-12-08 16:36:27.84
7b39e32e-3b98-4523-acc2-f120549a8339	modified	Formulaire participants complété (1 participant(s))	9e15b4c8-7ec2-4506-8f87-cd3d7171af81	2025-12-08 16:36:27.896
6384c8d5-d793-4f48-8729-0fc31f192981	created	Réservation créée pour 1 personne(s) - Canyon de Terneze	e3dcbbba-7a74-433a-be8b-a7356953f4f1	2025-12-09 07:12:15.644
32cb54ef-cfb2-4224-84c2-a2a2c63c88ec	modified	Formulaire participants complété (1 participant(s))	e3dcbbba-7a74-433a-be8b-a7356953f4f1	2025-12-09 07:12:15.755
354617c4-9883-4778-88ad-f439d73ac5d3	created	Réservation créée avec paiement Stripe (Payment Element) de 150€	23df70b4-f91b-4d1c-b30a-8ba7896a09d7	2025-12-09 07:29:45.067
\.


--
-- TOC entry 5189 (class 0 OID 34856)
-- Dependencies: 232
-- Data for Name: booking_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booking_notes (id, content, "bookingId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 5181 (class 0 OID 34653)
-- Dependencies: 224
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, "clientFirstName", "clientLastName", "clientEmail", "clientPhone", "clientNationality", "numberOfPeople", "totalPrice", "amountPaid", status, "sessionId", "createdAt", "updatedAt", "productId", "participantsFormCompleted", "productDetailsSent", "resellerId", "discountAmount", "voucherCode", "cancellationReason", "cancelledAt") FROM stdin;
55a1ff60-4312-4885-a93f-371cb37cea0d	Jérémy	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	50	5	confirmed	e559ff92-96e8-42f8-8075-4798ad4360a0	2025-11-04 09:43:44.747	2025-11-05 09:14:47.053	98c8144f-e533-478b-b86c-1091e897fabf	f	f	\N	50	3XVWS8ATTP	\N	\N
9e3a174e-2db5-4414-854c-d65cf0007a4f	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	50	15	confirmed	fccc1ce6-4677-4edd-9bc9-87e86c34ac8a	2025-11-06 08:56:26.974	2025-11-06 08:56:26.974	e60a37cf-2777-451f-abf6-6b8744e2cb66	f	f	\N	\N	\N	\N	\N
c7fcd753-a8d6-46fc-900c-b4c2d9404bae	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	50	50	confirmed	d3150623-2b14-480b-8e98-f9ca9cb0c9a6	2025-11-13 09:05:19.163	2025-11-13 09:20:47.239	e60a37cf-2777-451f-abf6-6b8744e2cb66	t	f	\N	\N	\N	\N	\N
9b4719cf-784d-4ea6-8359-cb2d8a4cb9f4	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	50	0	pending	21870c6d-4c22-4432-a8f1-f311ec1319b5	2025-11-06 09:09:02.247	2025-11-06 09:09:24.609	98c8144f-e533-478b-b86c-1091e897fabf	t	f	\N	\N	\N	\N	\N
201993a6-f16c-41a7-9505-c2166e90e4a4	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	50	50	confirmed	d3150623-2b14-480b-8e98-f9ca9cb0c9a6	2025-11-20 12:20:30.764	2025-11-20 12:20:30.764	e60a37cf-2777-451f-abf6-6b8744e2cb66	f	f	\N	\N	\N	\N	\N
4ce6c4f6-6458-4060-9cde-47beb9395ada	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	55	0	pending	519d2526-7037-461b-ba3a-d062a24b4814	2025-11-07 09:47:41.353	2025-11-08 16:09:16.355	f62e0670-455e-41b3-8fbc-1a8aab36c8de	f	f	\N	\N	\N	\N	\N
3b10d4ae-d9e5-4718-8ff1-326f03191a29	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	3	150	0	pending	e559ff92-96e8-42f8-8075-4798ad4360a0	2025-11-05 07:19:07.553	2025-11-05 07:19:07.553	98c8144f-e533-478b-b86c-1091e897fabf	f	f	\N	\N	\N	\N	\N
61408a2a-1459-49d5-83fc-626d5d830d98	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	6	300	0	pending	21870c6d-4c22-4432-a8f1-f311ec1319b5	2025-11-03 12:30:48.001	2025-11-05 07:26:30.079	98c8144f-e533-478b-b86c-1091e897fabf	f	f	\N	5	WN37VRHQ2H	\N	\N
f33027cb-faf1-4811-97d0-a2b0f64990e1	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	60	60	confirmed	4d736183-bfe0-4338-9214-43f091a18e8f	2025-11-12 07:07:07.164	2025-11-12 07:26:31.809	920953cb-103b-48d2-bb7b-f1ca81cc2929	t	f	\N	\N	\N	\N	\N
5efdef38-a2d4-46e2-a883-1f8384484c6b	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	50	50	confirmed	a0a04351-75a4-4a2c-9ace-021a7ef551f2	2025-11-13 07:28:07.864	2025-11-13 07:28:07.864	181e9397-6f0b-4741-8756-f353d11f651a	f	f	\N	\N	\N	\N	\N
bf28641d-7682-44d9-a2db-a0c6894756e8	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	50	50	confirmed	a0a04351-75a4-4a2c-9ace-021a7ef551f2	2025-11-13 08:48:55.198	2025-11-13 08:48:55.198	181e9397-6f0b-4741-8756-f353d11f651a	f	f	\N	\N	\N	\N	\N
5820e61e-6193-47f9-bffd-55ee2ac2aba0	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	50	50	confirmed	59e97cd7-7bc5-42d6-95da-411ca7f6dff4	2025-11-13 08:55:41.036	2025-11-13 08:55:41.036	e60a37cf-2777-451f-abf6-6b8744e2cb66	f	f	\N	\N	\N	\N	\N
fefaab47-733f-4dbc-bae4-24ec1d69bd3d	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	50	50	confirmed	6cc5fbf1-effc-4356-888d-05e81fc000a3	2025-11-13 09:00:56.438	2025-11-13 09:00:56.438	181e9397-6f0b-4741-8756-f353d11f651a	f	f	\N	\N	\N	\N	\N
c90c492b-af06-48fc-bc68-cee7afee6f62	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	50	50	confirmed	59e97cd7-7bc5-42d6-95da-411ca7f6dff4	2025-11-13 08:24:42.682	2025-11-25 13:37:54.95	e60a37cf-2777-451f-abf6-6b8744e2cb66	f	f	\N	\N	\N	\N	\N
ff45f108-b6d0-4839-8bf6-3a6c94e20b47	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	2	100	0	pending	e559ff92-96e8-42f8-8075-4798ad4360a0	2025-11-04 09:08:58.737	2025-11-05 09:14:47.039	98c8144f-e533-478b-b86c-1091e897fabf	t	f	\N	30	70C3RZDRTA	\N	\N
e3dcbbba-7a74-433a-be8b-a7356953f4f1	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	50	0	pending	73ac2139-3368-4098-b6f4-ce2548ad9128	2025-12-09 07:12:15.63	2025-12-09 07:12:15.749	181e9397-6f0b-4741-8756-f353d11f651a	f	f	\N	\N	\N	\N	\N
23df70b4-f91b-4d1c-b30a-8ba7896a09d7	Sandrine	REDON	marion.redon26@yahoo.fr	0613436135	FR	3	150	150	confirmed	645c98f1-a438-48bc-bd53-95b66c98f104	2025-12-09 07:29:45.03	2025-12-09 07:29:45.03	181e9397-6f0b-4741-8756-f353d11f651a	f	f	\N	\N	\N	\N	\N
146de3e4-4e3e-475d-a9f6-d5d52f468d47	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	50	0	pending	c276e3b7-3b31-45d9-8693-e595f809ae67	2025-11-25 13:51:25.774	2025-11-25 13:52:22.573	181e9397-6f0b-4741-8756-f353d11f651a	t	f	\N	\N	\N	\N	\N
d05c86ed-7397-4a3e-9d9d-f70d3faa04e8	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	60	0	pending	35af455d-a148-465b-9b29-84515d154b81	2025-12-02 14:59:08.23	2025-12-02 14:59:08.284	920953cb-103b-48d2-bb7b-f1ca81cc2929	f	f	\N	\N	\N	\N	\N
835c551e-c821-4bba-86d4-b72dd8911ba9	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	60	60	confirmed	35af455d-a148-465b-9b29-84515d154b81	2025-12-03 12:17:05.237	2025-12-03 12:17:05.237	920953cb-103b-48d2-bb7b-f1ca81cc2929	f	f	\N	\N	\N	\N	\N
4fa84797-cd41-4ad2-b030-534cb964ee02	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	60	60	confirmed	7048aaba-abbc-474c-838d-2dbc636b5bc2	2025-12-04 16:00:51.624	2025-12-04 16:00:51.624	920953cb-103b-48d2-bb7b-f1ca81cc2929	f	f	\N	\N	\N	\N	\N
9e15b4c8-7ec2-4506-8f87-cd3d7171af81	Marion	Grosfilley	marion.redon26@yahoo.fr	0613436135	FR	1	50	0	pending	645c98f1-a438-48bc-bd53-95b66c98f104	2025-12-08 16:36:27.834	2025-12-08 16:36:27.892	181e9397-6f0b-4741-8756-f353d11f651a	f	f	\N	\N	\N	\N	\N
\.


--
-- TOC entry 5178 (class 0 OID 34603)
-- Dependencies: 221
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, description, "createdAt", "updatedAt") FROM stdin;
060b8b96-c6cd-49c3-8d64-f255920b8450	Vercors		2025-11-03 09:53:45.39	2025-11-03 09:53:45.39
2aeebdbb-148e-44cf-9da1-7e5a4a56444a	Chartreuse		2025-11-03 12:28:43.186	2025-11-03 12:28:43.186
\.


--
-- TOC entry 5191 (class 0 OID 34891)
-- Dependencies: 234
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_templates (id, type, name, subject, "htmlContent", "textContent", variables, "isActive", "createdAt", "updatedAt", "userId") FROM stdin;
15750e2e-4f46-4bf8-abcd-fb257219b870	booking_confirmation	Confirmation de réservation	Confirmation de réservation - {{productName}}	<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <style>\n    body {\n      font-family: Arial, sans-serif;\n      line-height: 1.6;\n      color: #333;\n      max-width: 600px;\n      margin: 0 auto;\n      padding: 20px;\n      background: #fff;\n    }\n    .logo {\n      text-align: center;\n      margin-bottom: 20px;\n    }\n    .warning {\n      background: #fff9c4;\n      border-left: 4px solid #fbc02d;\n      padding: 12px 16px;\n      margin: 20px 0;\n    }\n    a {\n      color: #1976d2;\n      text-decoration: none;\n    }\n    a:hover {\n      text-decoration: underline;\n    }\n    ul {\n      margin: 10px 0;\n      padding-left: 25px;\n    }\n    ul li {\n      margin: 8px 0;\n    }\n  </style>\n</head>\n<body>\n  <div class="logo">\n    <img src="{{logo}}" alt="{{companyName}}" style="max-width: 250px; height: auto;" />\n  </div>\n\n  <p>Bonjour {{clientFirstName}},</p>\n\n  <p>Votre réservation est confirmée !</p>\n\n  <p>Vous trouverez vos billets en pièce jointe.</p>\n\n  <div class="warning">\n    ⚠️ <strong>Important</strong>, vous devez <a href="{{bookingLink}}">remplir le formulaire</a> sur les participants ⚠️\n  </div>\n\n  <p>Pour que tout se passe au mieux, pense à arriver au moins 5 minutes avant l'heure de rendez-vous.</p>\n\n  <p><strong>Point de rendez-vous :</strong> <a href="{{googleMapsLink}}">Google maps</a> / <a href="{{wazeLink}}">Waze</a></p>\n\n  <p><strong>N'oublie pas d'emporter avec toi :</strong></p>\n\n  <ul>\n    <li>Des chaussures qui accrochent, comme des baskets, et prévois également des chaussures de rechange pour après l'activité.</li>\n    <li>Ton maillot de bain (porté directement sous tous les vêtements)</li>\n    <li>Une serviette de bain pour te sécher et te changer après le canyon.</li>\n    <li>Une bouteille d'eau pour rester bien hydraté(e) tout au long de l'expérience.</li>\n  </ul>\n\n  <p>{{postBookingMessage}}</p>\n\n  <p>Et surtout, amène avec toi toute la bonne humeur !</p>\n\n  <p>Avec ça, on est sûr de passer un super moment ensemble. 😊</p>\n\n  <p>À très bientôt !</p>\n\n  <p>{{guideName}} (celui que tu devras chercher sur le parking)</p>\n</body>\n</html>	Bonjour {{clientFirstName}} {{clientLastName}},\n\nVotre réservation a été confirmée avec succès !\n\nDÉTAILS DE VOTRE RÉSERVATION\n-----------------------------\nActivité: {{productName}}\nDate: {{sessionDate}}\nCréneau: {{sessionTimeSlot}} - {{sessionStartTime}}\nGuide: {{guideName}}\nNombre de personnes: {{numberOfPeople}}\nPrix total: {{totalPrice}}€\nMontant payé: {{amountPaid}}€\nReste à payer: {{amountDue}}€\n\nINFORMATIONS IMPORTANTES\n{{postBookingMessage}}\n\nÀ très bientôt pour cette aventure inoubliable !\n\nL'équipe {{companyName}}	\N	t	2025-11-03 12:31:46.158	2025-11-03 12:31:46.158	\N
2d0608ab-1c7f-413d-bd4d-49fd8aafc9c6	booking_reminder	Rappel de réservation	🔔 Rappel - {{productName}} demain !	<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <style>\n    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }\n    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px; }\n    .content { padding: 20px; background: #fffbeb; margin-top: 20px; border-radius: 8px; }\n  </style>\n</head>\n<body>\n  <div class="header">\n    <h1>⏰ Rappel - Votre activité est demain !</h1>\n  </div>\n  <div class="content">\n    <p>Bonjour {{clientFirstName}} {{clientLastName}},</p>\n    <p><strong>N'oubliez pas :</strong> Votre activité <strong>{{productName}}</strong> a lieu demain !</p>\n    <p>📅 Date : {{sessionDate}}</p>\n    <p>⏰ Heure : {{sessionStartTime}}</p>\n    <p>👥 Guide : {{guideName}}</p>\n    <p>À demain ! 🏔️</p>\n  </div>\n</body>\n</html>	Bonjour {{clientFirstName}} {{clientLastName}},\n\nRappel : Votre activité {{productName}} a lieu demain !\n\nDate : {{sessionDate}}\nHeure : {{sessionStartTime}}\nGuide : {{guideName}}\n\nÀ demain ! 🏔️	\N	t	2025-11-03 12:31:46.185	2025-11-03 12:31:46.185	\N
8c99f9ae-5a2f-4a92-b830-bd8e5389defc	payment_confirmation	Confirmation de paiement	Paiement reçu - {{productName}}	\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <style>\n    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n    .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n    .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }\n    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }\n    .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #28a745; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>✓ Paiement reçu</h1>\n    </div>\n    <div class="content">\n      <p>Bonjour {{clientFirstName}},</p>\n      <p>Nous avons bien reçu votre paiement de <strong>{{amountPaid}}€</strong> pour <strong>{{productName}}</strong>.</p>\n\n      <div class="info-box">\n        <h3>Détails du paiement</h3>\n        <p><strong>Montant de ce paiement :</strong> {{amountPaid}}€</p>\n        <p><strong>Total payé :</strong> {{totalPaid}}€</p>\n        <p><strong>Prix total :</strong> {{totalPrice}}€</p>\n        <p><strong>Montant restant :</strong> {{amountDue}}€</p>\n      </div>\n\n      <p>Merci pour votre confiance !</p>\n      <p>L'équipe</p>\n    </div>\n  </div>\n</body>\n</html>	Bonjour {{clientFirstName}},\n\nNous avons bien reçu votre paiement de {{amountPaid}}€ pour {{productName}}.\n\nDÉTAILS DU PAIEMENT\nMontant de ce paiement : {{amountPaid}}€\nTotal payé : {{totalPaid}}€\nPrix total : {{totalPrice}}€\nMontant restant : {{amountDue}}€\n\nMerci pour votre confiance !\nL'équipe	\N	t	2025-11-03 12:31:46.206	2025-11-03 12:31:46.206	\N
f3274401-0455-47c0-a42e-babc651ab19a	gift_voucher	Bon cadeau	Votre bon cadeau	\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <style>\n    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n    .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n    .header { background: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }\n    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }\n    .voucher { background: white; padding: 30px; margin: 20px 0; border-radius: 8px; border: 3px dashed #e74c3c; text-align: center; }\n    .code { font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 4px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <div class="header">\n      <h1>🎁 Votre bon cadeau</h1>\n    </div>\n    <div class="content">\n      <p>Bonjour,</p>\n      <p>Voici votre bon cadeau !</p>\n\n      <div class="voucher">\n        <h2>BON CADEAU</h2>\n        <p>Code :</p>\n        <div class="code">XXXXXX</div>\n        <p style="margin-top: 20px;">Montant : XX€</p>\n      </div>\n\n      <p>Pour utiliser ce bon cadeau, rendez-vous sur notre site de réservation et entrez le code lors de la réservation.</p>\n      <p>Merci et à bientôt !</p>\n    </div>\n  </div>\n</body>\n</html>	Votre bon cadeau\n\nCode : XXXXXX\nMontant : XX€\n\nPour utiliser ce bon cadeau, rendez-vous sur notre site de réservation et entrez le code lors de la réservation.\n\nMerci et à bientôt !	\N	t	2025-11-03 12:31:46.215	2025-11-03 12:31:46.215	\N
41c5288c-3205-4cd9-ac29-5ddbf054b267	booking_confirmation	Confirmation de réservation	Confirmation de réservation - {{productName}}	<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <style>\n    body {\n      font-family: Arial, sans-serif;\n      line-height: 1.6;\n      color: #333;\n      max-width: 600px;\n      margin: 0 auto;\n      padding: 20px;\n      background: #fff;\n    }\n    .logo {\n      text-align: center;\n      margin-bottom: 20px;\n    }\n    .warning {\n      background: #fff9c4;\n      border-left: 4px solid #fbc02d;\n      padding: 12px 16px;\n      margin: 20px 0;\n    }\n    a {\n      color: #1976d2;\n      text-decoration: none;\n    }\n    a:hover {\n      text-decoration: underline;\n    }\n    ul {\n      margin: 10px 0;\n      padding-left: 25px;\n    }\n    ul li {\n      margin: 8px 0;\n    }\n  </style>\n</head>\n<body>\n  <div class="logo">\n    <img src="{{logo}}" alt="{{companyName}}" style="max-width: 250px; height: auto;" />\n  </div>\n\n  <p>Bonjour {{clientFirstName}},</p>\n\n  <p>Votre réservation est confirmée !</p>\n\n  <p>Vous trouverez vos billets en pièce jointe.</p>\n\n  <div class="warning">\n    ⚠️ <strong>Important</strong>, vous devez <a href="{{bookingLink}}">remplir le formulaire</a> sur les participants ⚠️\n  </div>\n\n  <p>Pour que tout se passe au mieux, pense à arriver au moins 5 minutes avant l'heure de rendez-vous.</p>\n\n  <p><strong>Point de rendez-vous :</strong> <a href="{{googleMapsLink}}">Google maps</a> / <a href="{{wazeLink}}">Waze</a></p>\n\n  <p><strong>N'oublie pas d'emporter avec toi :</strong></p>\n\n  <ul>\n    <li>Des chaussures qui accrochent, comme des baskets, et prévois également des chaussures de rechange pour après l'activité.</li>\n    <li>Ton maillot de bain (porté directement sous tous les vêtements)</li>\n    <li>Une serviette de bain pour te sécher et te changer après le canyon.</li>\n    <li>Une bouteille d'eau pour rester bien hydraté(e) tout au long de l'expérience.</li>\n  </ul>\n\n  <p>{{postBookingMessage}}</p>\n\n  <p>Et surtout, amène avec toi toute la bonne humeur !</p>\n\n  <p>Avec ça, on est sûr de passer un super moment ensemble. 😊</p>\n\n  <p>À très bientôt !</p>\n\n  <p>{{guideName}} (celui que tu devras chercher sur le parking)</p>\n</body>\n</html>	Bonjour {{clientFirstName}} {{clientLastName}},\n\nVotre réservation a été confirmée avec succès !\n\nDÉTAILS DE VOTRE RÉSERVATION\n-----------------------------\nActivité: {{productName}}\nDate: {{sessionDate}}\nCréneau: {{sessionTimeSlot}} - {{sessionStartTime}}\nGuide: {{guideName}}\nNombre de personnes: {{numberOfPeople}}\nPrix total: {{totalPrice}}€\nMontant payé: {{amountPaid}}€\nReste à payer: {{amountDue}}€\n\nINFORMATIONS IMPORTANTES\n{{postBookingMessage}}\n\nÀ très bientôt pour cette aventure inoubliable !\n\nL'équipe {{companyName}}	\N	t	2025-12-04 15:57:24.477	2025-12-04 15:57:24.477	087af464-83ec-4800-b868-4280e7a42577
\.


--
-- TOC entry 5194 (class 0 OID 46371)
-- Dependencies: 237
-- Data for Name: equipment_lists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipment_lists (id, name, items, "userId", "createdAt", "updatedAt") FROM stdin;
da141e40-a3c8-4bef-b089-fdb04e6e0a8e	Matériel de Canyoning	-Maillot de bain sur soi\n-Serviette	087af464-83ec-4800-b868-4280e7a42577	2025-11-12 14:18:46.12	2025-11-12 14:18:46.12
\.


--
-- TOC entry 5184 (class 0 OID 34700)
-- Dependencies: 227
-- Data for Name: gift_vouchers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gift_vouchers (id, code, amount, "createdAt", "expiresAt", type, "maxUsages", "usageCount", "discountType", notes, "userId", "buyerEmail", message, "recipientEmail", "recipientName") FROM stdin;
d85d57f9-cb87-456f-b9e6-426630c53904	XJD7Z3KR9K	50	2025-11-06 14:26:18.031	2026-11-06 14:26:18.029	gift	\N	0	fixed	Payment Intent: pi_3SQU8ZGx1flWKAcI184WpNow	b0e4a01b-3a93-486c-96ca-2d259da9e0e0	marion.redon26@yahoo.fr	\N	\N	\N
c14e2fb2-e3a3-4de2-9635-3cbc17a5196a	G22ZTEVHC4	50	2025-11-06 14:29:05.554	2026-11-06 14:29:05.552	gift	\N	0	fixed	Payment Intent: pi_3SQUBBGx1flWKAcI043wNUBp	b0e4a01b-3a93-486c-96ca-2d259da9e0e0	marion.redon26@yahoo.fr	\N	\N	\N
9d465cba-923a-4e51-aeea-4d21275cf673	6E9DSWCW90	50	2025-11-06 14:33:10.261	2026-11-06 14:33:10.26	gift	\N	0	fixed	Payment Intent: pi_3SQUFCGx1flWKAcI1IUX0ZVj	b0e4a01b-3a93-486c-96ca-2d259da9e0e0	marion.redon26@yahoo.fr	\N	\N	\N
b1895dd6-32b2-4849-914d-2ef819e90d0e	IIN4FIH44Q	50	2025-11-07 07:44:33.478	2026-11-07 07:44:33.475	voucher	1	0	fixed	Payment Intent: pi_3SQkLIGx1flWKAcI0Mke1mKL	087af464-83ec-4800-b868-4280e7a42577	marion.redon26@yahoo.fr	\N	\N	\N
71676ea2-2e7d-4d5f-ac69-14becbe38670	15JA91USQQ	100	2025-11-07 08:21:27.515	2026-11-07 08:21:27.513	voucher	1	0	fixed	Payment Intent: pi_3SQktRGx1flWKAcI0ZI0WO3i	087af464-83ec-4800-b868-4280e7a42577	marion.redon26@yahoo.fr	\N	marion.redon26@yahoo.fr	Marion Grosfilley
f730362a-22ab-4a9b-84e5-e760b41da386	ZFGDXSGNIK	75	2025-11-07 08:58:22.089	2026-11-07 08:58:22.084	voucher	1	0	fixed	Payment Intent: pi_3SQlUdGx1flWKAcI1RepHids	b0e4a01b-3a93-486c-96ca-2d259da9e0e0	marion.redon26@yahoo.fr	\N	\N	\N
9e69e102-87a1-4952-b996-31118dc6d298	46LE2S2W8Y	75	2025-11-13 07:30:36.196	2026-11-13 07:30:36.192	voucher	1	0	fixed	Payment Intent: pi_3SSuyxGx1flWKAcI1hFkfW2A	087af464-83ec-4800-b868-4280e7a42577	marion.redon26@yahoo.fr	\N	\N	\N
3392e9e8-f560-4b24-bc2b-c0d9d2e51489	Z0UJC6QCWT	50	2025-11-13 08:13:32.758	2026-11-13 08:13:32.757	voucher	1	0	fixed	Payment Intent: pi_3SSveeGx1flWKAcI12G6eLpY	087af464-83ec-4800-b868-4280e7a42577	marion.redon26@yahoo.fr	Joyeux anniversaire	m.redon26@gmail.fr	\N
fa6f378b-9bd4-4563-8d0a-9e87f5bc849a	P6LZ7IE25K	30	2025-12-04 15:56:24.353	\N	voucher	\N	0	fixed	\N	087af464-83ec-4800-b868-4280e7a42577	\N	\N	\N	\N
\.


--
-- TOC entry 5193 (class 0 OID 34928)
-- Dependencies: 236
-- Data for Name: newsletter; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.newsletter (id, email, "acceptedTerms", "isActive", "firstName", "lastName", source, "subscribedAt", "unsubscribedAt", "userId") FROM stdin;
f4e81186-7a81-4388-9320-608f6920994b	marion.redon26@yahoo.fr	t	t	Marion	Grosfilley	booking	2025-11-03 12:30:47.981	\N	\N
\.


--
-- TOC entry 5187 (class 0 OID 34807)
-- Dependencies: 230
-- Data for Name: participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.participants (id, "firstName", age, height, weight, "wetsuitSize", "shoeRental", "shoeSize", "bookingId", "createdAt", "updatedAt", "isComplete") FROM stdin;
6d19916a-0ea6-4f62-b9ea-3cc48c3bb7e5	Marion	29	168	96	T5	f	\N	61408a2a-1459-49d5-83fc-626d5d830d98	2025-11-03 12:31:15.15	2025-11-03 12:31:15.15	t
20dc28b2-2f56-4a81-9243-894422640f6b	Jérémy	33	172	85	T4	f	\N	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-04 09:09:35.488	2025-11-04 09:09:35.488	t
d89ef2df-56b8-4ed1-8518-fbc1f1f1e200	Marion	29	168	96	T5	f	\N	ff45f108-b6d0-4839-8bf6-3a6c94e20b47	2025-11-04 09:09:35.488	2025-11-04 09:09:35.488	t
f73f8c58-bdd9-4aa3-ae14-dd66b62ae805	Jérémy	\N	\N	\N	\N	f	\N	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-04 09:43:44.771	2025-11-04 09:43:44.771	f
a263e41a-1b82-46cc-9bcd-e061f6fc85cc	Marion	29	168	98	\N	f	\N	9e3a174e-2db5-4414-854c-d65cf0007a4f	2025-11-06 08:56:27.001	2025-11-06 08:56:27.001	f
ddb7d3b4-bcec-4f89-bcc9-ab05ba414d3d	Marion	29	168	96	T5	f	\N	9b4719cf-784d-4ea6-8359-cb2d8a4cb9f4	2025-11-06 09:09:24.606	2025-11-06 09:09:24.606	t
e649247b-795c-4368-8fdc-ce5e5f8bb343	Marion	\N	\N	\N	\N	f	\N	4ce6c4f6-6458-4060-9cde-47beb9395ada	2025-11-07 09:47:41.403	2025-11-07 09:47:41.403	f
65e9a803-028f-4b1e-b5d3-0cdd84e86ce2	Marion	29	168	96	T5	f	\N	f33027cb-faf1-4811-97d0-a2b0f64990e1	2025-11-12 07:26:31.795	2025-11-12 07:26:31.795	t
e43efcb5-98c9-4987-9430-38615b57d1ad	Marion	\N	\N	\N	\N	f	\N	5efdef38-a2d4-46e2-a883-1f8384484c6b	2025-11-13 07:28:07.888	2025-11-13 07:28:07.888	f
96fdcf6f-5369-4cf8-86a0-04d321aa5cd2	Marion	\N	\N	\N	\N	f	\N	c90c492b-af06-48fc-bc68-cee7afee6f62	2025-11-13 08:24:42.697	2025-11-13 08:24:42.697	f
983bdecf-4d08-4f21-aa8c-f70b4d502507	Marion	\N	\N	\N	\N	f	\N	bf28641d-7682-44d9-a2db-a0c6894756e8	2025-11-13 08:48:55.215	2025-11-13 08:48:55.215	f
a8db75ac-9a4c-4388-919a-c4c4d94e0e94	Marion	\N	\N	\N	\N	f	\N	5820e61e-6193-47f9-bffd-55ee2ac2aba0	2025-11-13 08:55:41.051	2025-11-13 08:55:41.051	f
1485380c-5206-4453-8233-3bd279b82502	Marion	\N	\N	\N	\N	f	\N	fefaab47-733f-4dbc-bae4-24ec1d69bd3d	2025-11-13 09:00:56.45	2025-11-13 09:00:56.45	f
a5bd8d59-fdee-4883-8413-1b590d8a5eb1	Marion	29	168	96	T5	f	\N	c7fcd753-a8d6-46fc-900c-b4c2d9404bae	2025-11-13 09:20:47.221	2025-11-13 09:20:47.221	t
7499ae41-e519-43c0-be2e-a028f7680d17	Marion	\N	\N	\N	\N	f	\N	201993a6-f16c-41a7-9505-c2166e90e4a4	2025-11-20 12:20:30.813	2025-11-20 12:20:30.813	f
ece752f2-b7c3-4d8f-9671-541f834aca92	Marion	29	168	96	T5	f	\N	146de3e4-4e3e-475d-a9f6-d5d52f468d47	2025-11-25 13:52:22.571	2025-11-25 13:52:22.571	t
23d5df10-e075-4d69-831d-293eef070b95	Marion	\N	\N	\N	\N	f	\N	d05c86ed-7397-4a3e-9d9d-f70d3faa04e8	2025-12-02 14:59:08.281	2025-12-02 14:59:08.281	f
88296ae6-2ca3-4b8a-bd0e-471693154e79	Marion	\N	\N	\N	\N	f	\N	835c551e-c821-4bba-86d4-b72dd8911ba9	2025-12-03 12:17:05.266	2025-12-03 12:17:05.266	f
7bd44fd8-2903-4f6f-bf63-78c068265c5f	Marion	\N	\N	\N	\N	f	\N	4fa84797-cd41-4ad2-b030-534cb964ee02	2025-12-04 16:00:51.677	2025-12-04 16:00:51.677	f
d7c32892-0370-4bd2-b5c3-2265a4fbf01d	Marion	\N	\N	\N	\N	f	\N	9e15b4c8-7ec2-4506-8f87-cd3d7171af81	2025-12-08 16:36:27.889	2025-12-08 16:36:27.889	f
332bc3b8-f0a9-473f-b7b3-dc41b7537f5d	Marion	\N	\N	\N	\N	f	\N	e3dcbbba-7a74-433a-be8b-a7356953f4f1	2025-12-09 07:12:15.74	2025-12-09 07:12:15.74	f
2d47a6fb-b422-441f-aae5-b7357d98a172	Sandrine	\N	\N	\N	\N	f	\N	23df70b4-f91b-4d1c-b30a-8ba7896a09d7	2025-12-09 07:29:45.094	2025-12-09 07:29:45.094	f
3d22d2c7-0ed6-49db-a400-1370a7cc6cff		\N	\N	\N	\N	f	\N	23df70b4-f91b-4d1c-b30a-8ba7896a09d7	2025-12-09 07:29:45.103	2025-12-09 07:29:45.103	f
3ecaaec5-dabf-4314-987a-4ca8e8fdbf7c		\N	\N	\N	\N	f	\N	23df70b4-f91b-4d1c-b30a-8ba7896a09d7	2025-12-09 07:29:45.11	2025-12-09 07:29:45.11	f
\.


--
-- TOC entry 5195 (class 0 OID 48930)
-- Dependencies: 238
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_resets (id, "userId", token, "expiresAt", "createdAt", used) FROM stdin;
90185936-e782-4a44-8220-20f28c57ba65	94803be5-262b-4502-979d-c9ebcec26a0d	5959d3ee208f00a7c92454e02cbcb13ca256b635597cd1e05eeaa09070581233	2025-11-25 16:20:59.708	2025-11-25 15:20:59.71	t
\.


--
-- TOC entry 5182 (class 0 OID 34675)
-- Dependencies: 225
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, amount, method, "stripeId", notes, "bookingId", "createdAt", "discountAmount", "voucherCode") FROM stdin;
6742bcca-fc47-4ae5-972b-bf9c0a259f7e	5	stripe	\N	Payment Intent: pi_3SPgmBGx1flWKAcI1XXotSTv	55a1ff60-4312-4885-a93f-371cb37cea0d	2025-11-04 09:43:44.763	50	3XVWS8ATTP
0168cee8-81a2-48c1-8190-899fdde8ca9e	15	stripe	\N	Payment Intent: pi_3SQOzKGx1flWKAcI1vqK8hy0	9e3a174e-2db5-4414-854c-d65cf0007a4f	2025-11-06 08:56:26.998	\N	\N
c6ac63ef-142f-40ef-af74-fe9eaa12a8bc	60	stripe	\N	Payment Intent: pi_3SSY8XGx1flWKAcI1vhPosLX	f33027cb-faf1-4811-97d0-a2b0f64990e1	2025-11-12 07:07:07.2	\N	\N
385bff41-9b71-4aac-a5b7-7619cb3b76d7	50	stripe	\N	Payment Intent: pi_3SSuwgGx1flWKAcI1ewpB7NZ	5efdef38-a2d4-46e2-a883-1f8384484c6b	2025-11-13 07:28:07.883	\N	\N
7679e31f-e513-4425-98e4-b7c31986cef6	50	stripe	\N	Payment Intent: pi_3SSvpSGx1flWKAcI1Vf4UjF2	c90c492b-af06-48fc-bc68-cee7afee6f62	2025-11-13 08:24:42.694	\N	\N
8356c97d-94f5-4300-bb78-f8456eb47837	50	stripe	\N	Payment Intent: pi_3SSwCrGx1flWKAcI15aXW0ov	bf28641d-7682-44d9-a2db-a0c6894756e8	2025-11-13 08:48:55.21	\N	\N
4f3b2760-8396-406b-80b0-78ed4a659bee	50	stripe	\N	Payment Intent: pi_3SSwJHGx1flWKAcI1JVOxKD6	5820e61e-6193-47f9-bffd-55ee2ac2aba0	2025-11-13 08:55:41.048	\N	\N
0068e2e3-1ae9-4219-8e0d-f66cbe38fbf9	50	stripe	\N	Payment Intent: pi_3SSwOTGx1flWKAcI1eP0grGe	fefaab47-733f-4dbc-bae4-24ec1d69bd3d	2025-11-13 09:00:56.447	\N	\N
99a67f20-f99d-4d31-b78e-570b76d87a3e	50	stripe	\N	Payment Intent: pi_3SSwSnGx1flWKAcI1D2yVR9r	c7fcd753-a8d6-46fc-900c-b4c2d9404bae	2025-11-13 09:05:19.185	\N	\N
555eece9-6f6b-44f9-8fda-a93ef00b2a17	50	stripe	\N	Payment Intent: pi_3SVWqQGx1flWKAcI1JzmTnQe	201993a6-f16c-41a7-9505-c2166e90e4a4	2025-11-20 12:20:30.807	\N	\N
07126f5c-ecc6-4ba5-b67c-46279f866808	60	stripe	\N	Payment Intent: pi_3SaEzAGx1flWKAcI0ddzmuzn	835c551e-c821-4bba-86d4-b72dd8911ba9	2025-12-03 12:17:05.261	\N	\N
e382ce7e-5742-454e-843f-c72a8cd010dc	60	stripe	\N	Payment Intent: pi_3SaexNGx1flWKAcI0Alfx9lm	4fa84797-cd41-4ad2-b030-534cb964ee02	2025-12-04 16:00:51.666	\N	\N
19cfa0b8-1fe6-4581-9b8c-935e5fe53ad8	150	stripe	\N	Payment Intent: pi_3ScLMRGx1flWKAcI1GzS91G1	23df70b4-f91b-4d1c-b30a-8ba7896a09d7	2025-12-09 07:29:45.085	\N	\N
\.


--
-- TOC entry 5186 (class 0 OID 34782)
-- Dependencies: 229
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_categories (id, "productId", "categoryId", "createdAt") FROM stdin;
d7174fc9-0f99-494c-a831-bf6d32ad09e0	45b742d0-72e1-4e67-a49b-d60fe65f46e8	060b8b96-c6cd-49c3-8d64-f255920b8450	2025-11-03 09:55:29.887
79cc728e-f042-4c3c-9d7e-0d1060c89669	920953cb-103b-48d2-bb7b-f1ca81cc2929	060b8b96-c6cd-49c3-8d64-f255920b8450	2025-11-12 14:19:23.445
83734a9d-c87e-45a4-8f6a-0e4d01419360	e60a37cf-2777-451f-abf6-6b8744e2cb66	060b8b96-c6cd-49c3-8d64-f255920b8450	2025-11-12 14:19:32.693
b053a563-e747-46f6-a454-414f0fe17288	98c8144f-e533-478b-b86c-1091e897fabf	060b8b96-c6cd-49c3-8d64-f255920b8450	2025-11-12 14:19:44.037
ef2f1603-04bb-4804-9ba0-ed30c50c2c54	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2aeebdbb-148e-44cf-9da1-7e5a4a56444a	2025-11-12 14:19:52.319
6a628166-e27c-40b3-8203-d4b1bac9eee3	181e9397-6f0b-4741-8756-f353d11f651a	060b8b96-c6cd-49c3-8d64-f255920b8450	2025-12-04 15:56:53.304
\.


--
-- TOC entry 5179 (class 0 OID 34615)
-- Dependencies: 222
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, "shortDescription", "longDescription", "priceIndividual", "priceGroup", duration, color, level, "maxCapacity", "autoCloseHoursBefore", "postBookingMessage", "wazeLink", "googleMapsLink", images, "guideId", "createdAt", "updatedAt", region, "websiteLink", "activityTypeId", "equipmentListId", "meetingPoint") FROM stdin;
45b742d0-72e1-4e67-a49b-d60fe65f46e8	Canyon des Ecouges 2	Le canyon des Ecouges , c’est l’une des descentes les plus connues et les plus belles en Rhône-Alpes !	Le canyon des Ecouges , c’est l’une des descentes les plus connues et les plus belles en Rhône-Alpes !	50	{"min": 5, "price": 45}	180	#38db34	découverte	8	\N				{/uploads/product-1762163723708-759497824,/uploads/product-1762163723710-332966000,/uploads/product-1762163723712-429488418,/uploads/product-1762163723713-608179884,/uploads/product-1762163723721-649798669,/uploads/product-1762163723723-357685018}	b0e4a01b-3a93-486c-96ca-2d259da9e0e0	2025-11-03 09:55:29.887	2025-11-03 09:55:29.887	annecy		canyoning	\N	\N
98c8144f-e533-478b-b86c-1091e897fabf	Canyon du Versoud	Canyon du Vercors, dès 8 ans	Le Versoud est un canyon très mignon dans une ambiance verdoyante caractéristique des canyons du Vercors qui permet de se familiariser avec le canyoning.\n\nC’est une descente ludique qui permet de découvrir le rappel dès 8 ans.\n\nÀ mi chemin entre Grenoble et Valence, vous retrouverez tout ce qu’il existe de mieux dans un canyon : des rappels, des sauts, qui ne sont jamais obligatoire, et des toboggans.	50	{"min": 5, "price": 45}	180	#95db34	découverte	8	\N				{/uploads/product-1762172487122-924505003,/uploads/product-1762172487123-18954361,/uploads/product-1762172487126-930959704,/uploads/product-1762172487127-874278809}	087af464-83ec-4800-b868-4280e7a42577	2025-11-03 12:21:36.507	2025-11-12 14:19:44.054	annecy	https://www.canyonlife.fr/canyoning-chartreuse-vercors/canyoning-vercors/canyon-du-versoud/	canyoning	da141e40-a3c8-4bef-b089-fdb04e6e0a8e	\N
181e9397-6f0b-4741-8756-f353d11f651a	Canyon de Terneze	Situé au cœur du massif des Bauges, à deux pas de Chambéry, le canyon de Ternèze est un véritable terrain de jeu naturel. Une sortie idéale pour une découverte du canyoning en toute convivialité.	Situé au cœur du massif des Bauges, à deux pas de Chambéry, le canyon de Ternèze est un véritable terrain de jeu naturel. Une sortie idéale pour une découverte du canyoning en toute convivialité.	50	{"min": 5, "price": 45}	240	#db3453	aventure	8	12				{/uploads/product-1762930019371-499535087,/uploads/product-1762930019380-162016965,/uploads/product-1762930019384-118959818}	087af464-83ec-4800-b868-4280e7a42577	2025-11-12 06:47:15.984	2025-12-04 15:56:53.313	annecy		canyoning	da141e40-a3c8-4bef-b089-fdb04e6e0a8e	\N
920953cb-103b-48d2-bb7b-f1ca81cc2929	Canyon des Ecouges 2	Le canyon des Ecouges , c’est l’une des descentes les plus connues et les plus belles en Rhône-Alpes !	Le canyon des Ecouges , c’est l’une des descentes les plus connues et les plus belles en Rhône-Alpes !\n\nIl est à mi-chemin entre Grenoble et Valence et il permet une découverte de tout ce que l’on peut retrouver de mieux dans un canyon : des rappels, des sauts, qui ne sont jamais obligatoires, et des toboggans.\n\nL’ambiance y est dépaysante, un environnement rempli de nature dans un très bel encaissement.	60	{"min": 5, "price": 55}	240	#34dbb9	aventure	8	\N		https://ul.waze.com/ul?ll=45.12453441%2C5.66263676&navigate=yes&zoom=15&utm_campaign=default&utm_source=waze_website&utm_medium=lm_share_location	https://maps.app.goo.gl/ZwGmoHCvgPBrs26h7	{/uploads/product-1762172689711-140752206,/uploads/product-1762172689711-704128183,/uploads/product-1762172689712-359180665,/uploads/product-1762172689713-259179673,/uploads/product-1762172689714-969556317,/uploads/product-1762172689715-158569285}	087af464-83ec-4800-b868-4280e7a42577	2025-11-03 12:24:56.68	2025-11-12 14:19:23.466	annecy	https://www.canyonlife.fr/canyoning-chartreuse-vercors/canyoning-vercors/canyon-des-ecouges/	canyoning	da141e40-a3c8-4bef-b089-fdb04e6e0a8e	\N
e60a37cf-2777-451f-abf6-6b8744e2cb66	Canyon du Furon	Le Furon est une descente très ludique qui permet à tous, dès 10 ans, de découvrir cette activité dans un cadre sublime.	Le canyon du Furon , c’est l’incontournable Grenoblois. Au-dessus des cuves de Sassenage vous plongerez dans une atmosphère dépaysante qui vous fera oublier l’air de la ville !\n\nLe Furon est une descente très ludique qui permet à tous, dès 10 ans, de découvrir cette activité dans un cadre sublime.\n\nUne découverte de tout ce que l’on peut retrouver de mieux dans un canyon : des rappels, des sauts, qui ne sont jamais obligatoires, des toboggans, et même une tyrolienne !!	50	{"min": 5, "price": 45}	240	#3462db	aventure	8	\N				{/uploads/product-1762172778473-414699403,/uploads/product-1762172778473-42408023,/uploads/product-1762172778480-257474676}	087af464-83ec-4800-b868-4280e7a42577	2025-11-03 12:26:33.395	2025-11-12 14:19:32.705	annecy	https://www.canyonlife.fr/canyoning-chartreuse-vercors/canyoning-vercors/canyon-du-furon/	canyoning	da141e40-a3c8-4bef-b089-fdb04e6e0a8e	\N
f62e0670-455e-41b3-8fbc-1a8aab36c8de	L'Infernet	Dans ce canyon, nous retrouverons des accès vertigineux (type via-ferrata) et une première cascade de 25 mètres nécessitant d’être à l’aise avec la verticalité, mais aussi avec l’eau.	Le canyon de l’Infernet est exceptionnel !\nJe conseille cependant, en vue d’une expérience agréable pour chacun, d’avoir eu une première expérience en canyoning.\n\nDans ce canyon, nous retrouverons des accès vertigineux (type via-ferrata) et une première cascade de 25 mètres nécessitant d’être à l’aise avec la verticalité, mais aussi avec l’eau.\n\nPour le reste de la sortie, nous serons dans un gouffre dont les parois font plus de 70 mètres de haut. Autant dire que l’engagement est total ! La lumière y est réduite et l’ambiance complètement folle !	55	{"min": 5, "price": 50}	180	#a834db	sportif	8	\N				{/uploads/product-1762172897109-458975225,/uploads/product-1762172897109-58537987,/uploads/product-1762172897110-790937268}	087af464-83ec-4800-b868-4280e7a42577	2025-11-03 12:28:32.287	2025-11-12 14:19:52.325	annecy	https://www.canyonlife.fr/canyoning-chartreuse-vercors/canyoning-chartreuse/infernet-2-2/	canyoning	da141e40-a3c8-4bef-b089-fdb04e6e0a8e	\N
\.


--
-- TOC entry 5188 (class 0 OID 34834)
-- Dependencies: 231
-- Data for Name: promo_code_usages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_code_usages (id, "voucherId", "usedBy", "bookingId", "usedAt") FROM stdin;
\.


--
-- TOC entry 5190 (class 0 OID 34874)
-- Dependencies: 233
-- Data for Name: resellers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resellers (id, name, email, phone, commission, notes, "createdAt", "updatedAt", website, "userId") FROM stdin;
\.


--
-- TOC entry 5185 (class 0 OID 34752)
-- Dependencies: 228
-- Data for Name: session_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session_products (id, "sessionId", "productId", "createdAt", "productOverrides") FROM stdin;
5cf092ff-5255-437a-b1ef-0ae64595be29	22f42a78-aefe-4c92-98a0-28ee6c2a0a6c	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-03 12:29:19.866	\N
ae3cfb49-427b-4af9-8703-dc66f6da1fb6	22f42a78-aefe-4c92-98a0-28ee6c2a0a6c	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-03 12:29:19.866	\N
d66e6563-397c-4972-a3c5-095d6cb9875b	22f42a78-aefe-4c92-98a0-28ee6c2a0a6c	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-03 12:29:19.866	\N
208ebd1e-3f95-4159-b116-dd7120bef0b6	22f42a78-aefe-4c92-98a0-28ee6c2a0a6c	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-03 12:29:19.866	\N
31492282-374e-471d-b0a9-fa425928c569	bebb8814-b0d4-4e94-bc39-2d007ff508b1	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-03 12:29:27.492	\N
1aa663d2-4b06-4486-a862-d61b01ed1e20	bebb8814-b0d4-4e94-bc39-2d007ff508b1	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-03 12:29:27.492	\N
4bb33a63-877b-42d1-9365-53393b8e9e7b	bebb8814-b0d4-4e94-bc39-2d007ff508b1	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-03 12:29:27.492	\N
9e4e8b61-894a-4b92-868a-1244f473e285	bebb8814-b0d4-4e94-bc39-2d007ff508b1	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-03 12:29:27.492	\N
661019b2-e018-4a60-bb4a-f5b8ff62a7fb	e559ff92-96e8-42f8-8075-4798ad4360a0	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-03 12:29:27.564	\N
fc1cc6c9-dd44-4380-81f1-059131e27dd4	e559ff92-96e8-42f8-8075-4798ad4360a0	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-03 12:29:27.564	\N
0e048980-69dd-4731-ae16-f29ea250ae1a	e559ff92-96e8-42f8-8075-4798ad4360a0	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-03 12:29:27.564	\N
779c6ed9-2a10-4458-8ddf-013cc20358fd	e559ff92-96e8-42f8-8075-4798ad4360a0	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-03 12:29:27.564	\N
9cb6f55a-9357-41b4-af71-07f0aa1d5361	fccc1ce6-4677-4edd-9bc9-87e86c34ac8a	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-04 10:02:44.012	\N
e0253b10-f0d7-470d-b616-454c7e2f76b9	fccc1ce6-4677-4edd-9bc9-87e86c34ac8a	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-04 10:02:44.012	\N
fe5ab8b0-b9d4-4416-bedc-64113837d563	fccc1ce6-4677-4edd-9bc9-87e86c34ac8a	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-04 10:02:44.012	\N
40ea5af5-2a20-4a09-ad35-4e79f1816fec	fccc1ce6-4677-4edd-9bc9-87e86c34ac8a	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-04 10:02:44.012	\N
7ac07b37-7963-4ba4-9585-58373d1af293	21870c6d-4c22-4432-a8f1-f311ec1319b5	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-05 07:26:08.517	\N
ffa06764-e4a6-467e-8561-393c17f5ce0c	21870c6d-4c22-4432-a8f1-f311ec1319b5	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-05 07:26:08.517	\N
c914df54-1a02-4640-81f2-950a1812dd44	21870c6d-4c22-4432-a8f1-f311ec1319b5	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-05 07:26:08.517	\N
460d42de-2bef-4bb6-8812-d4d474607a8f	21870c6d-4c22-4432-a8f1-f311ec1319b5	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-05 07:26:08.517	\N
f4db0338-fc7b-41b0-9797-09322c5bfadf	19e128a6-398a-42a8-8e88-d76b95e8153d	45b742d0-72e1-4e67-a49b-d60fe65f46e8	2025-11-05 09:32:46.317	\N
2eeb42dd-5355-4032-93d4-03d3423965bf	19e128a6-398a-42a8-8e88-d76b95e8153d	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-05 09:32:46.317	\N
747026c0-6d51-4298-b9b6-1d243dc49fd2	19e128a6-398a-42a8-8e88-d76b95e8153d	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-05 09:32:46.317	\N
360c8a09-e677-4f5e-9d96-f307b5187a74	19e128a6-398a-42a8-8e88-d76b95e8153d	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-05 09:32:46.317	\N
e41268c5-944d-4c6b-b38a-4ad5d83ded39	19e128a6-398a-42a8-8e88-d76b95e8153d	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-05 09:32:46.317	\N
eaea5575-ad90-492f-ad56-b4a8001e2cb8	3471a6d3-424e-4131-a00c-0e6b402f40fc	45b742d0-72e1-4e67-a49b-d60fe65f46e8	2025-11-05 09:32:54.436	\N
da795658-81b9-4034-a259-bfed19b5c611	3471a6d3-424e-4131-a00c-0e6b402f40fc	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-05 09:32:54.436	\N
cd2bfdba-8955-4f4b-83b5-f944dcc7bd25	3471a6d3-424e-4131-a00c-0e6b402f40fc	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-05 09:32:54.436	\N
4faad684-3c84-4663-a47a-5622ab008203	3471a6d3-424e-4131-a00c-0e6b402f40fc	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-05 09:32:54.436	\N
1bfc0ad6-8943-4ed9-9b43-acd98073ce7b	3471a6d3-424e-4131-a00c-0e6b402f40fc	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-05 09:32:54.436	\N
15c5969c-42d2-4a9d-be38-7958a5d2d681	b835b259-f1c4-479f-8aa3-cd390497c8f9	45b742d0-72e1-4e67-a49b-d60fe65f46e8	2025-11-05 09:32:54.489	\N
88f82f60-8911-4fc9-aa3e-44968b246af8	b835b259-f1c4-479f-8aa3-cd390497c8f9	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-05 09:32:54.489	\N
3e1788ed-5a01-4b1b-950a-4bd263e6706c	b835b259-f1c4-479f-8aa3-cd390497c8f9	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-05 09:32:54.489	\N
1b16b945-195c-45f2-8a12-68918743917b	b835b259-f1c4-479f-8aa3-cd390497c8f9	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-05 09:32:54.489	\N
48e56dc8-df64-4bdd-b0d9-f05309dda740	b835b259-f1c4-479f-8aa3-cd390497c8f9	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-05 09:32:54.489	\N
435fd047-6fd0-4b55-86a8-4f7f49f3f472	9f28f2bf-9000-45a8-9eee-29bca6ee91d1	45b742d0-72e1-4e67-a49b-d60fe65f46e8	2025-11-05 09:32:54.516	\N
4f269611-6087-428d-ab86-38d831342023	9f28f2bf-9000-45a8-9eee-29bca6ee91d1	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-05 09:32:54.516	\N
68a41ec7-867d-4647-9441-5884bd25cce9	9f28f2bf-9000-45a8-9eee-29bca6ee91d1	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-05 09:32:54.516	\N
801dec0f-332d-4a4d-a595-0bc61479b2cf	9f28f2bf-9000-45a8-9eee-29bca6ee91d1	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-05 09:32:54.516	\N
0e6f396b-4c8b-4815-b34e-5542a827601f	9f28f2bf-9000-45a8-9eee-29bca6ee91d1	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-05 09:32:54.516	\N
1940bd12-5fa2-4735-8aa9-40898546da60	d52629e4-f3e1-4d80-85ca-2a7818c07f49	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-07 09:50:36.843	\N
e5039405-d0be-434e-99d6-8bb43fd64d2d	d52629e4-f3e1-4d80-85ca-2a7818c07f49	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-07 09:50:36.843	\N
cb9b6a64-1eb4-4a38-bd8c-41292c362074	d52629e4-f3e1-4d80-85ca-2a7818c07f49	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-07 09:50:36.843	\N
cf0476de-74b0-4c75-ad4c-f016863a52f0	d52629e4-f3e1-4d80-85ca-2a7818c07f49	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-07 09:50:36.843	\N
3668659f-e1f4-4f3b-bb68-8e68cb3ead36	4d736183-bfe0-4338-9214-43f091a18e8f	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-07 09:50:43.32	\N
8b0d0acc-7f2d-4343-b0db-8e494e6930a0	4d736183-bfe0-4338-9214-43f091a18e8f	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-07 09:50:43.32	\N
bcd67092-a970-43ce-b959-32c094c3b84c	4d736183-bfe0-4338-9214-43f091a18e8f	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-07 09:50:43.32	\N
62c78fff-406d-47c0-af39-482d1523224d	4d736183-bfe0-4338-9214-43f091a18e8f	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-07 09:50:43.32	\N
9cfc91bb-210c-4cd8-bb6c-be5d69ae58dd	519d2526-7037-461b-ba3a-d062a24b4814	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-08 16:03:22.616	\N
dbd2d270-d1b5-4895-9dcd-13af8d9c3065	519d2526-7037-461b-ba3a-d062a24b4814	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-08 16:03:22.616	\N
a5142979-cd2c-4816-808f-d62ca850e345	519d2526-7037-461b-ba3a-d062a24b4814	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-08 16:03:22.616	\N
e962a141-bfdc-405f-984f-f3710aa217c4	519d2526-7037-461b-ba3a-d062a24b4814	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-08 16:03:22.616	\N
d95e5315-eae3-4dfe-b029-57b98c4b75e4	8d3642c2-6b86-45d4-9c35-7932ffa27048	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-13 07:25:16.002	\N
3b27c5f2-e1d5-4cd2-9b55-e5503ce70227	8d3642c2-6b86-45d4-9c35-7932ffa27048	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-13 07:25:16.002	\N
73510841-b13e-4ae9-b8e8-2bfc4e1a5503	8d3642c2-6b86-45d4-9c35-7932ffa27048	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-13 07:25:16.002	\N
64f50cea-d3fa-4acf-a0d4-b9351f0649d2	8d3642c2-6b86-45d4-9c35-7932ffa27048	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-13 07:25:16.002	\N
4a19b6e3-df0d-414f-a929-ae301577ea68	8d3642c2-6b86-45d4-9c35-7932ffa27048	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-13 07:25:16.002	\N
0697f905-d37c-496b-9306-df2843154b94	a0a04351-75a4-4a2c-9ace-021a7ef551f2	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-13 07:25:38.683	\N
84976ecf-6217-4be3-b375-834254c54805	a0a04351-75a4-4a2c-9ace-021a7ef551f2	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-13 07:25:38.683	\N
46ad101a-1825-43f4-8f2a-2a026f0d5d6f	a0a04351-75a4-4a2c-9ace-021a7ef551f2	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-13 07:25:38.683	\N
1dae6d5e-ca42-4a7b-a82e-7bb6302c1166	a0a04351-75a4-4a2c-9ace-021a7ef551f2	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-13 07:25:38.683	\N
ef24ebde-cf02-4d99-8e7e-88d225307ad4	a0a04351-75a4-4a2c-9ace-021a7ef551f2	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-13 07:25:38.683	\N
028bbeea-5e79-457a-9ad3-c3ddf538ad83	0f34fe1a-1e64-4213-8a94-238266bf25b2	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-13 07:25:38.751	\N
60d45864-48c3-47ac-a1a2-32e053724044	0f34fe1a-1e64-4213-8a94-238266bf25b2	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-13 07:25:38.751	\N
227d3fed-7b89-42f4-8dfb-3f9d9a53de0e	0f34fe1a-1e64-4213-8a94-238266bf25b2	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-13 07:25:38.751	\N
d63ff5e5-3178-44b6-8107-8828d226d2ee	0f34fe1a-1e64-4213-8a94-238266bf25b2	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-13 07:25:38.751	\N
f7b15a31-ae55-4561-8507-add7263bc738	0f34fe1a-1e64-4213-8a94-238266bf25b2	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-13 07:25:38.751	\N
fd8950ef-05f3-4114-b947-81c18b2aa2db	dcbf6e74-167d-4362-a892-f4e987f3dc16	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-13 07:25:38.776	\N
2045a9d7-1cd4-4aca-adb3-d46a8f61e1f7	dcbf6e74-167d-4362-a892-f4e987f3dc16	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-13 07:25:38.776	\N
a0e2b35f-b5d7-469a-b00c-d72475ca71b2	dcbf6e74-167d-4362-a892-f4e987f3dc16	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-13 07:25:38.776	\N
b71ece5b-bcf0-4031-8a8e-de004f28749a	dcbf6e74-167d-4362-a892-f4e987f3dc16	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-13 07:25:38.776	\N
24d7f7d3-fa4b-49ca-97c9-fa7fd49c38e3	dcbf6e74-167d-4362-a892-f4e987f3dc16	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-13 07:25:38.776	\N
27739977-f505-4548-ac5b-2870d9ce185d	be589683-a954-4f77-a9fa-aa8daf0266dd	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-13 07:25:38.801	\N
5ff1cbcf-7b2e-45e4-8b6f-ab9bce9977c7	be589683-a954-4f77-a9fa-aa8daf0266dd	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-13 07:25:38.801	\N
7873f300-a26b-4b8a-8cf4-537a8d6272e9	be589683-a954-4f77-a9fa-aa8daf0266dd	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-13 07:25:38.801	\N
50c7b8c9-761b-4ecc-8c91-b271c9697c29	be589683-a954-4f77-a9fa-aa8daf0266dd	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-13 07:25:38.801	\N
5907cff3-f83c-4547-bdd2-db147ff45a01	be589683-a954-4f77-a9fa-aa8daf0266dd	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-13 07:25:38.801	\N
c587038b-39fa-4b39-9f60-7edaec7e9b9e	6cc5fbf1-effc-4356-888d-05e81fc000a3	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-13 07:25:38.826	\N
6154a457-1261-468f-841c-145384284d6a	6cc5fbf1-effc-4356-888d-05e81fc000a3	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-13 07:25:38.826	\N
2032ae87-8e97-410a-aa7a-b6a7709c6066	6cc5fbf1-effc-4356-888d-05e81fc000a3	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-13 07:25:38.826	\N
a8f61e2d-e30b-4cf2-bb88-7374cb50a4df	6cc5fbf1-effc-4356-888d-05e81fc000a3	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-13 07:25:38.826	\N
a2b21afd-6975-4e47-919c-9393d25c8a7a	6cc5fbf1-effc-4356-888d-05e81fc000a3	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-13 07:25:38.826	\N
4152978c-c9cb-472c-a159-6457c98f4eab	59e97cd7-7bc5-42d6-95da-411ca7f6dff4	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-13 07:25:38.848	\N
4801a7a1-1161-4822-97c1-eca1b80e6854	59e97cd7-7bc5-42d6-95da-411ca7f6dff4	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-13 07:25:38.848	\N
12bb5e2f-002c-4b87-aff0-4f0febd32247	59e97cd7-7bc5-42d6-95da-411ca7f6dff4	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-13 07:25:38.848	\N
cd10a4df-551e-452c-bc30-eec009460859	59e97cd7-7bc5-42d6-95da-411ca7f6dff4	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-13 07:25:38.848	\N
43b1034c-937a-49db-bc89-da8237267649	59e97cd7-7bc5-42d6-95da-411ca7f6dff4	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-13 07:25:38.848	\N
0945dc79-8028-4e7b-bd0c-24fbead5d1b0	c5742e89-7d48-48da-9146-3fadd1d44e4e	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-13 07:25:38.874	\N
bb0d0159-1a89-42e5-9a48-3d0540dec7a8	c5742e89-7d48-48da-9146-3fadd1d44e4e	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-13 07:25:38.874	\N
ac92ec26-9a5b-4e94-bcd4-d9402cde3064	c5742e89-7d48-48da-9146-3fadd1d44e4e	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-13 07:25:38.874	\N
ed6402c0-c4f8-441d-9e07-17b56a35226a	c5742e89-7d48-48da-9146-3fadd1d44e4e	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-13 07:25:38.874	\N
b7c8beef-5edd-4568-a70e-9275c8e9fdf4	c5742e89-7d48-48da-9146-3fadd1d44e4e	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-13 07:25:38.874	\N
3837f15d-f2a0-424e-ba88-523291b499de	d3150623-2b14-480b-8e98-f9ca9cb0c9a6	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-13 07:25:38.953	\N
37d48d9a-53fa-4f48-a191-85abf966ff42	d3150623-2b14-480b-8e98-f9ca9cb0c9a6	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-13 07:25:38.953	\N
e9ddfee1-8188-499e-aa82-250ccb984752	d3150623-2b14-480b-8e98-f9ca9cb0c9a6	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-13 07:25:38.953	\N
85b88e3b-edcf-4d65-941b-24eb2d33b3f7	d3150623-2b14-480b-8e98-f9ca9cb0c9a6	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-13 07:25:38.953	\N
53265b2c-e8a5-4065-bbd4-e161de169559	d3150623-2b14-480b-8e98-f9ca9cb0c9a6	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-13 07:25:38.953	\N
b3919c9f-2f32-4b20-bff1-effb81d26369	03259e70-743a-4d04-9894-e5ed22e16a74	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-14 07:49:09.414	\N
34ac81ae-ed9a-4385-93df-322c3e2bdb78	57362375-f79b-4ff3-9e9f-9157495f3ef6	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-24 11:40:18.898	\N
e515548d-ddd1-4cf6-99b2-002bfa8f6b17	57362375-f79b-4ff3-9e9f-9157495f3ef6	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-24 11:40:18.898	\N
de0f3aa9-64a2-43ac-85ba-52f4602187c7	57362375-f79b-4ff3-9e9f-9157495f3ef6	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-24 11:40:18.898	\N
15c51c32-ff19-457f-b51d-aaacabd5f4af	57362375-f79b-4ff3-9e9f-9157495f3ef6	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-24 11:40:18.898	\N
e09c71a9-0578-4de3-9cbd-c1eb069749aa	57362375-f79b-4ff3-9e9f-9157495f3ef6	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-24 11:40:18.898	\N
2cc62ead-9b04-4159-b690-75e8b55aed82	63c0a0c2-df95-498d-a47e-1235ad3ecc29	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-24 11:40:30.714	\N
e139d625-3797-4bf5-b9fe-396d97b8c415	63c0a0c2-df95-498d-a47e-1235ad3ecc29	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-24 11:40:30.714	\N
5a12aa95-d290-4147-8138-50340b1bb168	63c0a0c2-df95-498d-a47e-1235ad3ecc29	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-24 11:40:30.714	\N
1bb2decf-5c8c-4a22-9959-497811431a3a	63c0a0c2-df95-498d-a47e-1235ad3ecc29	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-24 11:40:30.714	\N
4dc35cba-ed8e-4c76-a9ef-3a5559bfb036	63c0a0c2-df95-498d-a47e-1235ad3ecc29	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-24 11:40:30.714	\N
e7a04d84-7d07-43ae-95dd-88efd6c1f64a	07b60afc-c265-4816-bb74-6a1c17f18dd6	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-24 11:40:30.74	\N
77711d4b-239a-4b68-b78f-afd7ae384e0e	07b60afc-c265-4816-bb74-6a1c17f18dd6	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-24 11:40:30.74	\N
8e50b53c-5de8-42de-b4c0-52ebc431c67d	07b60afc-c265-4816-bb74-6a1c17f18dd6	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-24 11:40:30.74	\N
5e76f910-ec5c-4ce7-b148-4221239f9207	07b60afc-c265-4816-bb74-6a1c17f18dd6	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-24 11:40:30.74	\N
2d87b20f-c3cc-4a2e-a026-cef8f69d3ffb	07b60afc-c265-4816-bb74-6a1c17f18dd6	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-24 11:40:30.74	\N
f65ef15e-cada-4951-9913-8c14813900bf	736cac1d-5083-4a48-b6c8-dcf2923d5969	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-24 11:40:30.765	\N
56231880-5f6f-4951-868c-09ba63f950e2	736cac1d-5083-4a48-b6c8-dcf2923d5969	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-24 11:40:30.765	\N
0a080b4b-ea1b-4aa4-b473-4c7647dfc134	736cac1d-5083-4a48-b6c8-dcf2923d5969	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-24 11:40:30.765	\N
0d19edf7-346d-4455-ab8b-5f1940295245	736cac1d-5083-4a48-b6c8-dcf2923d5969	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-24 11:40:30.765	\N
98fa1135-d965-4969-90ae-d541c5560b51	736cac1d-5083-4a48-b6c8-dcf2923d5969	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-24 11:40:30.765	\N
da1d767b-31e0-4cfe-be6b-e49428c59e11	bb7948e4-4fdd-4b19-ba4c-923a94dba9e0	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-24 11:40:30.787	\N
0f7abcd0-4bf4-4e34-b6c7-c6322f28df33	bb7948e4-4fdd-4b19-ba4c-923a94dba9e0	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-24 11:40:30.787	\N
ff65151f-13d7-4475-bbdd-778d91482d42	bb7948e4-4fdd-4b19-ba4c-923a94dba9e0	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-24 11:40:30.787	\N
1e6b8eb6-778b-4576-b85a-6ba214328aa4	bb7948e4-4fdd-4b19-ba4c-923a94dba9e0	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-24 11:40:30.787	\N
c4895837-728d-4fef-8b96-7c2d53075d38	bb7948e4-4fdd-4b19-ba4c-923a94dba9e0	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-24 11:40:30.787	\N
98453991-a747-4693-9b0f-1711daa211c7	cd2e07db-0a25-4f9b-abc7-496f4b88a311	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-24 11:40:30.808	\N
0631ff38-0210-478a-bee8-2da0d1fa76b3	cd2e07db-0a25-4f9b-abc7-496f4b88a311	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-24 11:40:30.808	\N
45e56a96-ae50-4824-8eda-9895918cb6ab	cd2e07db-0a25-4f9b-abc7-496f4b88a311	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-24 11:40:30.808	\N
a2be07f6-8a86-4357-b773-7c8e83f6ce93	cd2e07db-0a25-4f9b-abc7-496f4b88a311	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-24 11:40:30.808	\N
4f81e61d-a866-40f9-a826-d60bcb33315a	cd2e07db-0a25-4f9b-abc7-496f4b88a311	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-24 11:40:30.808	\N
b1145690-ebb8-414f-a540-436f3ad97ad0	bdd06b6a-dcab-40f0-85fa-86013f30940d	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-24 11:40:30.83	\N
9e48e458-646f-4f08-ba66-96d25122a809	bdd06b6a-dcab-40f0-85fa-86013f30940d	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-24 11:40:30.83	\N
dc724d68-5d38-4c94-a140-332af8603526	bdd06b6a-dcab-40f0-85fa-86013f30940d	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-24 11:40:30.83	\N
23b94cb4-7374-490c-84a7-15e2c57a00d8	bdd06b6a-dcab-40f0-85fa-86013f30940d	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-24 11:40:30.83	\N
44e23521-0b67-49ad-a79c-0c2ca39862b0	bdd06b6a-dcab-40f0-85fa-86013f30940d	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-24 11:40:30.83	\N
0742638b-625e-4476-a978-cdfb290ee553	e88dc264-96b9-40c8-8ce3-90d4aa80db23	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-25 13:33:38.897	\N
eb61e82e-a7ca-48dc-a0b8-02cc1deec547	e88dc264-96b9-40c8-8ce3-90d4aa80db23	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-25 13:33:38.897	\N
0a7ad8a1-0a75-44d5-9a2c-ad475e4e74a0	e88dc264-96b9-40c8-8ce3-90d4aa80db23	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-25 13:33:38.897	\N
a347d54e-f6ee-4d7d-bb74-7b9723a97a24	e88dc264-96b9-40c8-8ce3-90d4aa80db23	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-25 13:33:38.897	\N
98b22d3b-1532-40ba-9b7a-1c5d80b16993	e88dc264-96b9-40c8-8ce3-90d4aa80db23	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-25 13:33:38.897	\N
ed264d77-89ac-46d8-940e-fc31305a8f1c	37b30d63-76c5-49e6-b333-4ba0548a05cb	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-25 13:33:55.882	\N
a132b0d0-5950-4204-b36b-c49dbcb78056	37b30d63-76c5-49e6-b333-4ba0548a05cb	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-25 13:33:55.882	\N
7aa6ce50-3919-4072-9646-37b630bd315d	37b30d63-76c5-49e6-b333-4ba0548a05cb	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-25 13:33:55.882	\N
a84dfe59-6fa6-4978-b0b0-e409700cc522	37b30d63-76c5-49e6-b333-4ba0548a05cb	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-25 13:33:55.882	\N
4f284343-7d64-4843-a7c2-b4bdfb09dcde	37b30d63-76c5-49e6-b333-4ba0548a05cb	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-25 13:33:55.882	\N
b8acb4c1-dde4-44bf-b5ab-f0b10f4f8412	c276e3b7-3b31-45d9-8693-e595f809ae67	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-25 13:33:55.92	\N
95da05bb-2805-46b1-8b8f-72b8eaa2f379	c276e3b7-3b31-45d9-8693-e595f809ae67	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-25 13:33:55.92	\N
3e54e0c2-e821-496c-baca-c97bc1b6c306	c276e3b7-3b31-45d9-8693-e595f809ae67	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-25 13:33:55.92	\N
b7fb69ec-b410-48b0-a16d-5281a9323a5d	c276e3b7-3b31-45d9-8693-e595f809ae67	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-25 13:33:55.92	\N
792ee87a-a561-4ab9-b6c7-a29140c87b11	c276e3b7-3b31-45d9-8693-e595f809ae67	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-25 13:33:55.92	\N
5a6f9b49-9118-4b0b-860b-e2cc2a69fca6	589af4dc-eb09-4221-a96e-bfd34edd20d8	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-25 13:33:55.937	\N
cf73e84c-4978-4ece-ba6b-86ffe68172ec	589af4dc-eb09-4221-a96e-bfd34edd20d8	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-25 13:33:55.937	\N
c66f679d-0679-47dd-bf72-dd38e8364ea8	589af4dc-eb09-4221-a96e-bfd34edd20d8	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-25 13:33:55.937	\N
6bc8dd20-0978-4406-913b-64b899e3ccfd	589af4dc-eb09-4221-a96e-bfd34edd20d8	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-25 13:33:55.937	\N
4645ef99-9704-44ec-8ff8-f3521975eb60	589af4dc-eb09-4221-a96e-bfd34edd20d8	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-25 13:33:55.937	\N
b2effffb-5de9-496e-b135-fcfb655e9cd0	3d469f6c-48aa-4006-b0c5-c1a5434ac165	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-25 13:33:55.954	\N
54d8168b-3ca6-4430-b10d-3356b245c740	3d469f6c-48aa-4006-b0c5-c1a5434ac165	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-25 13:33:55.954	\N
0f8b7e3b-23d5-44c2-9af7-109861a83b65	3d469f6c-48aa-4006-b0c5-c1a5434ac165	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-25 13:33:55.954	\N
45de78d6-4e64-4495-a598-50f9d6e379b2	3d469f6c-48aa-4006-b0c5-c1a5434ac165	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-25 13:33:55.954	\N
0b6d2171-adb3-499b-99fd-5f64c41ed814	3d469f6c-48aa-4006-b0c5-c1a5434ac165	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-25 13:33:55.954	\N
58cbdc1f-0e03-4529-a519-f80dc5e55067	236ac522-2960-49f7-9af2-e8c80664544b	181e9397-6f0b-4741-8756-f353d11f651a	2025-11-25 13:33:55.973	\N
06bfd917-d3f8-402c-86ea-1b12db083282	236ac522-2960-49f7-9af2-e8c80664544b	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-11-25 13:33:55.973	\N
393051d4-907a-4bce-9970-06a94ad6b884	236ac522-2960-49f7-9af2-e8c80664544b	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-11-25 13:33:55.973	\N
a8cc87ae-64e1-45dc-82d4-42380c06fa9e	236ac522-2960-49f7-9af2-e8c80664544b	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-11-25 13:33:55.973	\N
0127706e-0b57-4f99-9af3-3f348e674a2d	236ac522-2960-49f7-9af2-e8c80664544b	98c8144f-e533-478b-b86c-1091e897fabf	2025-11-25 13:33:55.973	\N
16af5fb8-e401-487e-a4ee-99ee45ec3764	bd411d4e-0ce1-4e48-9282-17fc791ac4a8	181e9397-6f0b-4741-8756-f353d11f651a	2025-12-02 14:58:29.364	\N
a2478db2-4581-4ca1-baac-feb322a021f0	bd411d4e-0ce1-4e48-9282-17fc791ac4a8	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-12-02 14:58:29.364	\N
9ba1faa5-ece4-4076-abfc-e1e352f4234a	bd411d4e-0ce1-4e48-9282-17fc791ac4a8	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-12-02 14:58:29.364	\N
eb82c592-8296-45f9-ba46-bc7843b1141d	bd411d4e-0ce1-4e48-9282-17fc791ac4a8	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-12-02 14:58:29.364	\N
424a16f0-88ce-4383-ba93-b55c10eb8587	bd411d4e-0ce1-4e48-9282-17fc791ac4a8	98c8144f-e533-478b-b86c-1091e897fabf	2025-12-02 14:58:29.364	\N
8a882820-2852-45b3-b7b2-a116e359b0b5	d7be225c-33f4-4b2a-9605-f68c8bb4e067	181e9397-6f0b-4741-8756-f353d11f651a	2025-12-02 14:58:37.635	\N
051d8328-9c33-425d-8bb0-40bb57d9c084	d7be225c-33f4-4b2a-9605-f68c8bb4e067	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-12-02 14:58:37.635	\N
c8bfa5f6-ee66-4253-9359-c0746160f320	d7be225c-33f4-4b2a-9605-f68c8bb4e067	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-12-02 14:58:37.635	\N
e03b48ef-29a5-4aab-af78-15ec0cac32e5	d7be225c-33f4-4b2a-9605-f68c8bb4e067	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-12-02 14:58:37.635	\N
7eafe87f-c560-4404-a7bb-4bd27590414f	d7be225c-33f4-4b2a-9605-f68c8bb4e067	98c8144f-e533-478b-b86c-1091e897fabf	2025-12-02 14:58:37.635	\N
c31c3442-fbb5-49c4-b257-77da0b048793	35af455d-a148-465b-9b29-84515d154b81	181e9397-6f0b-4741-8756-f353d11f651a	2025-12-02 14:58:37.658	\N
c4bddce2-3bdb-473d-8222-2d2e645bb43b	35af455d-a148-465b-9b29-84515d154b81	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-12-02 14:58:37.658	\N
a72c1018-23ac-43a9-a47e-1090a07adfaa	35af455d-a148-465b-9b29-84515d154b81	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-12-02 14:58:37.658	\N
501190b3-a9a4-4a3d-ab80-96fc76bc158f	35af455d-a148-465b-9b29-84515d154b81	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-12-02 14:58:37.658	\N
4bc67262-9d61-4127-a04e-cbbf1887c330	35af455d-a148-465b-9b29-84515d154b81	98c8144f-e533-478b-b86c-1091e897fabf	2025-12-02 14:58:37.658	\N
dd30cb01-712d-4ad1-935c-607d3c112cf0	7048aaba-abbc-474c-838d-2dbc636b5bc2	181e9397-6f0b-4741-8756-f353d11f651a	2025-12-02 14:58:37.673	\N
c29e7ad7-d2b9-4e42-bd16-e25c05328e00	7048aaba-abbc-474c-838d-2dbc636b5bc2	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-12-02 14:58:37.673	\N
ac07d873-4e6c-4b4d-886b-de52f91f6582	7048aaba-abbc-474c-838d-2dbc636b5bc2	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-12-02 14:58:37.673	\N
1602b536-aa45-4123-b359-2572e91b5121	7048aaba-abbc-474c-838d-2dbc636b5bc2	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-12-02 14:58:37.673	\N
15d42729-c5f6-4fa0-8b9f-0434b509040a	7048aaba-abbc-474c-838d-2dbc636b5bc2	98c8144f-e533-478b-b86c-1091e897fabf	2025-12-02 14:58:37.673	\N
40eafe43-6864-4d76-b5d8-563d6b7a88f7	a77928b5-8d80-4e2e-bf97-e3392fd20110	181e9397-6f0b-4741-8756-f353d11f651a	2025-12-08 12:41:13.638	\N
6ccea1da-fcf9-4072-b28a-01ae75eeca9b	a77928b5-8d80-4e2e-bf97-e3392fd20110	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-12-08 12:41:13.638	\N
869b05aa-6558-46f5-a600-2c0c34d3268c	a77928b5-8d80-4e2e-bf97-e3392fd20110	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-12-08 12:41:13.638	\N
53589256-ae0e-4956-a11f-eea6ae606940	a77928b5-8d80-4e2e-bf97-e3392fd20110	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-12-08 12:41:13.638	\N
f6dba81d-e4ba-4dc4-b05e-d67c6c36621c	a77928b5-8d80-4e2e-bf97-e3392fd20110	98c8144f-e533-478b-b86c-1091e897fabf	2025-12-08 12:41:13.638	\N
45323232-fb4a-458f-9e26-282a23a8c9be	71a10a60-28c3-402d-999f-5b01ed645178	181e9397-6f0b-4741-8756-f353d11f651a	2025-12-08 12:41:22.34	\N
5094c3b7-af61-4157-842a-814d4a57d4ec	71a10a60-28c3-402d-999f-5b01ed645178	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-12-08 12:41:22.34	\N
6301973c-74e6-4820-93b9-f9d0e331b376	71a10a60-28c3-402d-999f-5b01ed645178	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-12-08 12:41:22.34	\N
5f423214-3eef-4f5d-8e4a-af00b12d8aef	71a10a60-28c3-402d-999f-5b01ed645178	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-12-08 12:41:22.34	\N
648336df-b02e-45df-921a-c3da337d7bbe	71a10a60-28c3-402d-999f-5b01ed645178	98c8144f-e533-478b-b86c-1091e897fabf	2025-12-08 12:41:22.34	\N
efdc619f-e75d-4673-a2e8-96986d682071	2f0f3fda-b627-4163-b014-c44b31ae0a29	181e9397-6f0b-4741-8756-f353d11f651a	2025-12-08 12:41:22.406	\N
ca906e8f-8cb5-4b6c-a247-75db8d00cc95	2f0f3fda-b627-4163-b014-c44b31ae0a29	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-12-08 12:41:22.406	\N
f75030a5-72c9-4387-896a-65c7a02b477c	2f0f3fda-b627-4163-b014-c44b31ae0a29	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-12-08 12:41:22.406	\N
536566ce-e231-4b1b-8356-12d86583a504	2f0f3fda-b627-4163-b014-c44b31ae0a29	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-12-08 12:41:22.406	\N
5d46a603-6e2b-41cc-b1bc-e5552ad37833	2f0f3fda-b627-4163-b014-c44b31ae0a29	98c8144f-e533-478b-b86c-1091e897fabf	2025-12-08 12:41:22.406	\N
ba6e8afa-aed0-4f8d-afb5-b82159ef76f1	645c98f1-a438-48bc-bd53-95b66c98f104	181e9397-6f0b-4741-8756-f353d11f651a	2025-12-08 12:41:22.472	\N
f3e77985-5b12-4f60-bebf-688f8ccf7b90	645c98f1-a438-48bc-bd53-95b66c98f104	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-12-08 12:41:22.472	\N
52ec8bf9-c49f-45aa-be66-a4d22e49fe53	645c98f1-a438-48bc-bd53-95b66c98f104	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-12-08 12:41:22.472	\N
fff52740-a846-4e4e-88e6-4d39c4cf8f85	645c98f1-a438-48bc-bd53-95b66c98f104	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-12-08 12:41:22.472	\N
e478ede9-c63c-454c-9b2b-daa730c0e2a8	645c98f1-a438-48bc-bd53-95b66c98f104	98c8144f-e533-478b-b86c-1091e897fabf	2025-12-08 12:41:22.472	\N
5f19c8ef-5b4f-45a9-afc3-75d2c1a1948c	f942cefc-3d90-426c-930e-a66e63e49d1d	181e9397-6f0b-4741-8756-f353d11f651a	2025-12-08 12:41:22.529	\N
ed6489ae-f94f-4daa-b7c8-441caa5c6649	f942cefc-3d90-426c-930e-a66e63e49d1d	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-12-08 12:41:22.529	\N
f0d11528-01db-458f-8819-c958276a6c3a	f942cefc-3d90-426c-930e-a66e63e49d1d	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-12-08 12:41:22.529	\N
c72541df-d45c-4658-b37a-51b4cab696c6	f942cefc-3d90-426c-930e-a66e63e49d1d	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-12-08 12:41:22.529	\N
b27c93ef-7661-4897-b791-3b4afa67f59d	f942cefc-3d90-426c-930e-a66e63e49d1d	98c8144f-e533-478b-b86c-1091e897fabf	2025-12-08 12:41:22.529	\N
7439ea54-e36c-49e0-b535-6aa8589ef677	73ac2139-3368-4098-b6f4-ce2548ad9128	181e9397-6f0b-4741-8756-f353d11f651a	2025-12-08 12:41:22.605	\N
ee249853-3d7a-4502-ad23-f72a04c463b4	73ac2139-3368-4098-b6f4-ce2548ad9128	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-12-08 12:41:22.605	\N
71ed18c6-9385-4f0b-9729-a5251e343979	73ac2139-3368-4098-b6f4-ce2548ad9128	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-12-08 12:41:22.605	\N
d5df0377-f881-4c75-9c66-eb0af032d352	73ac2139-3368-4098-b6f4-ce2548ad9128	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-12-08 12:41:22.605	\N
75c9f934-4fdb-4749-a6e7-d481ffb47e8d	73ac2139-3368-4098-b6f4-ce2548ad9128	98c8144f-e533-478b-b86c-1091e897fabf	2025-12-08 12:41:22.605	\N
62bc80e8-a674-4c93-a937-36648ab35785	98db5467-ac68-466c-b4e0-275fcaa3fc42	181e9397-6f0b-4741-8756-f353d11f651a	2025-12-08 12:41:22.67	\N
3a3429a0-d81f-4cf5-b2ab-92d007c38553	98db5467-ac68-466c-b4e0-275fcaa3fc42	920953cb-103b-48d2-bb7b-f1ca81cc2929	2025-12-08 12:41:22.67	\N
5e943a2e-54a5-4b8f-bad4-45ac7eeb7bbb	98db5467-ac68-466c-b4e0-275fcaa3fc42	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-12-08 12:41:22.67	\N
429ad32e-d5af-40ce-a29d-de50446601da	98db5467-ac68-466c-b4e0-275fcaa3fc42	f62e0670-455e-41b3-8fbc-1a8aab36c8de	2025-12-08 12:41:22.67	\N
437e0a2b-78b3-4b7b-8d8c-231ae44b51b3	98db5467-ac68-466c-b4e0-275fcaa3fc42	98c8144f-e533-478b-b86c-1091e897fabf	2025-12-08 12:41:22.67	\N
f04701f7-4ca9-40ec-9f2b-b808cdb32155	39e46512-6853-4e7e-b41f-199e31b38097	e60a37cf-2777-451f-abf6-6b8744e2cb66	2025-12-08 12:42:01.207	\N
\.


--
-- TOC entry 5180 (class 0 OID 34634)
-- Dependencies: 223
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, date, "timeSlot", "startTime", "isMagicRotation", status, "guideId", "createdAt", "updatedAt", "shoeRentalAvailable", "shoeRentalPrice") FROM stdin;
22f42a78-aefe-4c92-98a0-28ee6c2a0a6c	2025-11-03 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-03 12:29:19.863	2025-11-03 12:29:19.863	t	5
bebb8814-b0d4-4e94-bc39-2d007ff508b1	2025-11-04 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-03 12:29:27.489	2025-11-03 12:29:27.489	t	5
e559ff92-96e8-42f8-8075-4798ad4360a0	2025-11-09 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-03 12:29:27.562	2025-11-03 12:29:27.562	t	5
736cac1d-5083-4a48-b6c8-dcf2923d5969	2025-11-27 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-24 11:40:30.762	2025-11-24 11:40:30.762	f	\N
bb7948e4-4fdd-4b19-ba4c-923a94dba9e0	2025-11-28 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-24 11:40:30.784	2025-11-24 11:40:30.784	f	\N
cd2e07db-0a25-4f9b-abc7-496f4b88a311	2025-11-29 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-24 11:40:30.805	2025-11-24 11:40:30.805	f	\N
bdd06b6a-dcab-40f0-85fa-86013f30940d	2025-11-30 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-24 11:40:30.827	2025-11-24 11:40:30.827	f	\N
fccc1ce6-4677-4edd-9bc9-87e86c34ac8a	2025-11-07 00:00:00	matin	09:00	t	open	9b02cfb3-1329-420f-9af1-fbedbfe10fa6	2025-11-03 12:29:27.537	2025-11-04 10:02:44.007	t	5
21870c6d-4c22-4432-a8f1-f311ec1319b5	2025-11-08 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-05 07:26:08.506	2025-11-05 07:26:08.506	f	\N
19e128a6-398a-42a8-8e88-d76b95e8153d	2025-11-06 00:00:00	matin	09:00	t	open	b0e4a01b-3a93-486c-96ca-2d259da9e0e0	2025-11-05 09:32:46.305	2025-11-05 09:32:46.305	f	\N
3471a6d3-424e-4131-a00c-0e6b402f40fc	2025-11-07 00:00:00	matin	09:00	t	open	b0e4a01b-3a93-486c-96ca-2d259da9e0e0	2025-11-05 09:32:54.428	2025-11-05 09:32:54.428	f	\N
b835b259-f1c4-479f-8aa3-cd390497c8f9	2025-11-08 00:00:00	matin	09:00	t	open	b0e4a01b-3a93-486c-96ca-2d259da9e0e0	2025-11-05 09:32:54.486	2025-11-05 09:32:54.486	f	\N
9f28f2bf-9000-45a8-9eee-29bca6ee91d1	2025-11-09 00:00:00	matin	09:00	t	open	b0e4a01b-3a93-486c-96ca-2d259da9e0e0	2025-11-05 09:32:54.512	2025-11-05 09:32:54.512	f	\N
d52629e4-f3e1-4d80-85ca-2a7818c07f49	2025-11-12 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-07 09:50:36.836	2025-11-07 09:50:36.836	f	\N
4d736183-bfe0-4338-9214-43f091a18e8f	2025-11-14 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-07 09:50:43.318	2025-11-07 09:50:43.318	f	\N
519d2526-7037-461b-ba3a-d062a24b4814	2025-11-11 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-08 16:03:22.598	2025-11-08 16:03:22.598	f	\N
8d3642c2-6b86-45d4-9c35-7932ffa27048	2025-11-15 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-13 07:25:15.998	2025-11-13 07:25:15.998	t	5
a0a04351-75a4-4a2c-9ace-021a7ef551f2	2025-11-16 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-13 07:25:38.679	2025-11-13 07:25:38.679	t	5
0f34fe1a-1e64-4213-8a94-238266bf25b2	2025-11-17 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-13 07:25:38.747	2025-11-13 07:25:38.747	t	5
dcbf6e74-167d-4362-a892-f4e987f3dc16	2025-11-18 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-13 07:25:38.773	2025-11-13 07:25:38.773	t	5
be589683-a954-4f77-a9fa-aa8daf0266dd	2025-11-19 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-13 07:25:38.798	2025-11-13 07:25:38.798	t	5
6cc5fbf1-effc-4356-888d-05e81fc000a3	2025-11-20 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-13 07:25:38.824	2025-11-13 07:25:38.824	t	5
59e97cd7-7bc5-42d6-95da-411ca7f6dff4	2025-11-21 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-13 07:25:38.845	2025-11-13 07:25:38.845	t	5
c5742e89-7d48-48da-9146-3fadd1d44e4e	2025-11-22 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-13 07:25:38.867	2025-11-13 07:25:38.867	t	5
d3150623-2b14-480b-8e98-f9ca9cb0c9a6	2025-11-23 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-13 07:25:38.949	2025-11-13 07:25:38.949	t	5
03259e70-743a-4d04-9894-e5ed22e16a74	2025-11-15 00:00:00	matin	09:00	f	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-14 07:49:09.409	2025-11-14 07:49:09.409	f	\N
57362375-f79b-4ff3-9e9f-9157495f3ef6	2025-11-24 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-24 11:40:18.894	2025-11-24 11:40:18.894	f	\N
63c0a0c2-df95-498d-a47e-1235ad3ecc29	2025-11-25 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-24 11:40:30.711	2025-11-24 11:40:30.711	f	\N
07b60afc-c265-4816-bb74-6a1c17f18dd6	2025-11-26 00:00:00	après-midi	13:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-24 11:40:30.737	2025-11-24 11:40:30.737	f	\N
e88dc264-96b9-40c8-8ce3-90d4aa80db23	2025-11-25 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-25 13:33:38.891	2025-11-25 13:33:38.891	f	\N
37b30d63-76c5-49e6-b333-4ba0548a05cb	2025-11-26 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-25 13:33:55.877	2025-11-25 13:33:55.877	f	\N
c276e3b7-3b31-45d9-8693-e595f809ae67	2025-11-27 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-25 13:33:55.916	2025-11-25 13:33:55.916	f	\N
589af4dc-eb09-4221-a96e-bfd34edd20d8	2025-11-28 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-25 13:33:55.935	2025-11-25 13:33:55.935	f	\N
3d469f6c-48aa-4006-b0c5-c1a5434ac165	2025-11-29 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-25 13:33:55.951	2025-11-25 13:33:55.951	f	\N
236ac522-2960-49f7-9af2-e8c80664544b	2025-11-30 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-11-25 13:33:55.971	2025-11-25 13:33:55.971	f	\N
bd411d4e-0ce1-4e48-9282-17fc791ac4a8	2025-12-02 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-12-02 14:58:29.34	2025-12-02 14:58:29.34	f	\N
d7be225c-33f4-4b2a-9605-f68c8bb4e067	2025-12-04 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-12-02 14:58:37.632	2025-12-02 14:58:37.632	f	\N
35af455d-a148-465b-9b29-84515d154b81	2025-12-05 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-12-02 14:58:37.656	2025-12-02 14:58:37.656	f	\N
7048aaba-abbc-474c-838d-2dbc636b5bc2	2025-12-06 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-12-02 14:58:37.671	2025-12-02 14:58:37.671	f	\N
a77928b5-8d80-4e2e-bf97-e3392fd20110	2025-12-08 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-12-08 12:41:13.629	2025-12-08 12:41:13.629	f	\N
71a10a60-28c3-402d-999f-5b01ed645178	2025-12-09 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-12-08 12:41:22.332	2025-12-08 12:41:22.332	f	\N
2f0f3fda-b627-4163-b014-c44b31ae0a29	2025-12-10 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-12-08 12:41:22.397	2025-12-08 12:41:22.397	f	\N
645c98f1-a438-48bc-bd53-95b66c98f104	2025-12-11 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-12-08 12:41:22.463	2025-12-08 12:41:22.463	f	\N
f942cefc-3d90-426c-930e-a66e63e49d1d	2025-12-12 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-12-08 12:41:22.522	2025-12-08 12:41:22.522	f	\N
73ac2139-3368-4098-b6f4-ce2548ad9128	2025-12-13 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-12-08 12:41:22.595	2025-12-08 12:41:22.595	f	\N
98db5467-ac68-466c-b4e0-275fcaa3fc42	2025-12-14 00:00:00	matin	09:00	t	open	087af464-83ec-4800-b868-4280e7a42577	2025-12-08 12:41:22.662	2025-12-08 12:41:22.662	f	\N
39e46512-6853-4e7e-b41f-199e31b38097	2025-12-10 00:00:00	matin	09:00	f	open	087af464-83ec-4800-b868-4280e7a42577	2025-12-08 12:42:01.2	2025-12-08 12:42:01.2	f	\N
\.


--
-- TOC entry 5192 (class 0 OID 34911)
-- Dependencies: 235
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, "companyName", "companyPhone", "companyEmail", logo, "primaryColor", "secondaryColor", "createdAt", "updatedAt", "clientAccentColor", "clientButtonColor", slogan, website, "userId") FROM stdin;
9f233215-e437-4885-bb27-381222e61a32	\N	\N	\N	\N	\N	\N	2025-11-25 15:23:05.449	2025-11-25 15:23:05.449	\N	\N	\N	\N	94803be5-262b-4502-979d-c9ebcec26a0d
cb7f844a-25b4-4c40-b695-79cf2e5632f1	Terra canyon		marion.redon26@yahoo.fr	/uploads/logo-087af464-83ec-4800-b868-4280e7a42577.png	#33b1db	#2b3450	2025-11-04 08:39:20.265	2025-12-09 07:18:01.332	#33a3db	#33a3db		https://terracanyon.fr/	087af464-83ec-4800-b868-4280e7a42577
4da51b46-07c1-4974-9132-30643b873291	CanyonLife	+33613436135	admin@canyonlife.com	/uploads/logo-b0e4a01b-3a93-486c-96ca-2d259da9e0e0.webp	#db333c	#4f2b2b	2025-11-03 08:01:36.904	2025-11-05 08:01:04.681	#3498db	#3498db		https://www.canyonlife.fr/	b0e4a01b-3a93-486c-96ca-2d259da9e0e0
488945f0-e0f1-4d0b-a319-b438a359d1ca	\N	\N	\N	\N	\N	\N	2025-11-05 09:21:55.553	2025-11-05 09:21:55.553	\N	\N	\N	\N	b036501b-be1b-4cd0-ae76-d406698a2a62
ef9b473f-df7f-490e-874c-8c363a98f76d	\N	\N	\N	\N	\N	\N	2025-11-05 09:38:18.707	2025-11-05 09:38:18.707	\N	\N	\N	\N	9b02cfb3-1329-420f-9af1-fbedbfe10fa6
1cde3e00-9988-490b-8030-79649dbeeeb9	\N	\N	\N	\N	\N	\N	2025-11-05 09:38:31.86	2025-11-05 09:38:31.86	\N	\N	\N	\N	11a299b1-36e4-4cc3-9d35-ca9eca96758d
\.


--
-- TOC entry 5197 (class 0 OID 48964)
-- Dependencies: 240
-- Data for Name: trusted_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trusted_devices (id, "userId", "deviceName", "expiresAt", "createdAt", "lastUsedAt", jti, revoked) FROM stdin;
d07ecd71-9cc0-43b5-b65c-ddec162d0078	087af464-83ec-4800-b868-4280e7a42577	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-12-06 12:23:24.598	2025-12-04 12:23:24.6	2025-12-04 15:50:44.928	92abcdee-1b98-4eff-8896-e1d7e1f55e78	t
46e971d1-cc80-4ce4-9a48-5b71bbb0ad5c	087af464-83ec-4800-b868-4280e7a42577	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-12-11 15:50:44.948	2025-12-04 15:50:44.951	2025-12-08 12:39:12.194	4a85804c-7661-4ccb-8ca2-c97e70fe03de	t
793f0e5d-6073-42f3-8d75-7b8eb4235fb2	087af464-83ec-4800-b868-4280e7a42577	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-12-15 12:39:12.229	2025-12-08 12:39:12.234	2025-12-08 12:39:12.761	6608040c-29b2-4753-8c80-0e1d43eab68b	t
a0be7523-cce7-45bf-ab67-b20657423e9e	087af464-83ec-4800-b868-4280e7a42577	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-12-15 12:39:12.784	2025-12-08 12:39:12.786	2025-12-08 16:35:22.908	ed5ebcbc-19e7-41a0-9733-9202872b50af	t
11efc7d9-1626-4865-a667-5b3db5f4d274	087af464-83ec-4800-b868-4280e7a42577	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-12-15 16:35:22.915	2025-12-08 16:35:22.916	2025-12-09 06:56:22.846	ed6e1f99-ce0b-4769-9f86-595f74b8d7c5	t
c0b5fe9f-7aed-4efa-88f9-35c13ce510e4	087af464-83ec-4800-b868-4280e7a42577	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-12-16 06:56:22.873	2025-12-09 06:56:22.876	2025-12-09 07:17:19.092	12481a9e-daba-47a5-aff5-debfdd77b48b	t
89fe4de6-4cde-4d1f-b42d-f8236d8259a9	087af464-83ec-4800-b868-4280e7a42577	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-12-16 07:17:19.099	2025-12-09 07:17:19.102	2025-12-09 07:39:53.152	b75e2faf-1073-4c96-8305-b6001d90c8ac	t
4933e8a2-d5b2-49bf-9200-5600a02fffbc	087af464-83ec-4800-b868-4280e7a42577	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36	2025-12-16 07:39:53.167	2025-12-09 07:39:53.179	2025-12-09 07:39:53.179	f165f452-a6b1-48e9-a494-3ecb68546075	f
\.


--
-- TOC entry 5196 (class 0 OID 48945)
-- Dependencies: 239
-- Data for Name: two_factor_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.two_factor_codes (id, "userId", code, email, "expiresAt", "createdAt", verified, attempts, "tempToken") FROM stdin;
\.


--
-- TOC entry 5177 (class 0 OID 34588)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, login, password, email, "stripeAccount", role, "createdAt", "updatedAt", "confidentialityPolicy", "depositAmount", "depositType", "paymentMode", "practiceActivities", "teamLeaderId", "teamName", phone, "twoFactorEnabled") FROM stdin;
05a913bd-ff08-4256-b9a1-922c00a68cea	Alex	$2a$10$qae29Pe2GMqrtTjopjHGTu9tVzRd4IJ8m.hn0vJu.7R8vchjHNFB2	marion.redon26@yahoo.fr		leader	2025-11-03 08:42:08.622	2025-11-03 08:42:08.622		\N	\N	onsite_only	{}	\N	Rouge	\N	t
087af464-83ec-4800-b868-4280e7a42577	Vincent	$2a$10$J0XmsQdJx6XLzXz8dEEnt.0faitCbfh.BELLDTHj7crNxTeBZxTYe	marion.redon26@yahoo.fr	acct_1SaDeLGbqCV5KGwI	leader	2025-11-03 08:41:15.411	2025-12-09 07:18:01.353	https://www.canyonlife.fr/canyoning-chartreuse-vercors/conditions-generales-de-vente/	\N	percentage	full_or_later	{canyoning}	\N	Bleue	0613422345	t
11a299b1-36e4-4cc3-9d35-ca9eca96758d	Jérémy	$2a$10$CywN0harP8OL4ELAif0WhuTL4FLJwp8zy3FdMi2EhmGjauoPud5de	marion.redon26@yahoo.fr		employee	2025-11-03 09:13:24.38	2025-11-18 07:33:12.117		\N	\N	onsite_only	{}	087af464-83ec-4800-b868-4280e7a42577	Bleue	0642538344	t
94803be5-262b-4502-979d-c9ebcec26a0d	Marion	$2a$10$0N1AHrY9CVj10uZuLSsujeQ4O4YiE0IJjOPVNqvxskl.rRDGi2chu	marion.redon26@yahoo.fr		employee	2025-11-03 08:44:09.639	2025-11-25 15:21:33.596	\N	\N	\N	onsite_only	\N	05a913bd-ff08-4256-b9a1-922c00a68cea	Rouge	\N	t
b036501b-be1b-4cd0-ae76-d406698a2a62	François	$2a$10$7VtE8AWA55d4Ec7dflEdjOFeTNKWYuf5lR5m1Ccq0CTrFo9uTsS/W	marion.redon26@yahoo.fr		leader	2025-11-05 09:21:55.553	2025-11-05 09:21:55.553		\N	\N	onsite_only	{}	\N	\N	\N	t
b0e4a01b-3a93-486c-96ca-2d259da9e0e0	canyonlife	$2a$10$d/RxmJswahyUExTnHB53yupASM5nGB9/3FL3qBkswoeoCIjJYMRri	marion.redon26@yahoo.fr	\N	super_admin	2025-11-03 08:01:20.405	2025-11-24 13:42:23.712	\N	\N	\N	onsite_only	{canyoning}	\N	\N	\N	t
9b02cfb3-1329-420f-9af1-fbedbfe10fa6	Florian	$2a$10$psN.IImBOk/K9gRulA39p.66zKo2YktUFyAUlBkDVlb1/1eHswVEC	marion.redon26@yahoo.fr	acct_1SPJPfGShmTx9lYM	trainee	2025-11-03 08:41:43.988	2025-11-14 08:40:31.69	https://www.canyonlife.fr/canyoning-chartreuse-vercors/conditions-generales-de-vente/	30	percentage	deposit_only	\N	087af464-83ec-4800-b868-4280e7a42577	Bleue	0613435654	t
\.


--
-- TOC entry 4945 (class 2606 OID 34587)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 5002 (class 2606 OID 50974)
-- Name: activity_form_configs activity_form_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_form_configs
    ADD CONSTRAINT activity_form_configs_pkey PRIMARY KEY (id);


--
-- TOC entry 4960 (class 2606 OID 34699)
-- Name: booking_history booking_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_history
    ADD CONSTRAINT booking_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4975 (class 2606 OID 34868)
-- Name: booking_notes booking_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_notes
    ADD CONSTRAINT booking_notes_pkey PRIMARY KEY (id);


--
-- TOC entry 4956 (class 2606 OID 34674)
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- TOC entry 4950 (class 2606 OID 34614)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4979 (class 2606 OID 34907)
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 4990 (class 2606 OID 46384)
-- Name: equipment_lists equipment_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_lists
    ADD CONSTRAINT equipment_lists_pkey PRIMARY KEY (id);


--
-- TOC entry 4963 (class 2606 OID 34713)
-- Name: gift_vouchers gift_vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gift_vouchers
    ADD CONSTRAINT gift_vouchers_pkey PRIMARY KEY (id);


--
-- TOC entry 4988 (class 2606 OID 34942)
-- Name: newsletter newsletter_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.newsletter
    ADD CONSTRAINT newsletter_pkey PRIMARY KEY (id);


--
-- TOC entry 4971 (class 2606 OID 34824)
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- TOC entry 4992 (class 2606 OID 48944)
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- TOC entry 4958 (class 2606 OID 34687)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 4968 (class 2606 OID 34793)
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4952 (class 2606 OID 34633)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4973 (class 2606 OID 34844)
-- Name: promo_code_usages promo_code_usages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_code_usages
    ADD CONSTRAINT promo_code_usages_pkey PRIMARY KEY (id);


--
-- TOC entry 4977 (class 2606 OID 34885)
-- Name: resellers resellers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT resellers_pkey PRIMARY KEY (id);


--
-- TOC entry 4965 (class 2606 OID 34763)
-- Name: session_products session_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_products
    ADD CONSTRAINT session_products_pkey PRIMARY KEY (id);


--
-- TOC entry 4954 (class 2606 OID 34652)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4983 (class 2606 OID 34923)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4985 (class 2606 OID 38491)
-- Name: settings settings_userId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT "settings_userId_key" UNIQUE ("userId");


--
-- TOC entry 4999 (class 2606 OID 48978)
-- Name: trusted_devices trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_pkey PRIMARY KEY (id);


--
-- TOC entry 4995 (class 2606 OID 48963)
-- Name: two_factor_codes two_factor_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.two_factor_codes
    ADD CONSTRAINT two_factor_codes_pkey PRIMARY KEY (id);


--
-- TOC entry 4948 (class 2606 OID 34602)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5000 (class 1259 OID 50975)
-- Name: activity_form_configs_activityTypeId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "activity_form_configs_activityTypeId_userId_key" ON public.activity_form_configs USING btree ("activityTypeId", "userId");


--
-- TOC entry 4980 (class 1259 OID 34944)
-- Name: email_templates_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_templates_type_idx ON public.email_templates USING btree (type);


--
-- TOC entry 4981 (class 1259 OID 34945)
-- Name: email_templates_userId_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "email_templates_userId_type_idx" ON public.email_templates USING btree ("userId", type);


--
-- TOC entry 4961 (class 1259 OID 34715)
-- Name: gift_vouchers_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX gift_vouchers_code_key ON public.gift_vouchers USING btree (code);


--
-- TOC entry 4986 (class 1259 OID 34943)
-- Name: newsletter_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX newsletter_email_key ON public.newsletter USING btree (email);


--
-- TOC entry 4993 (class 1259 OID 48979)
-- Name: password_resets_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX password_resets_token_key ON public.password_resets USING btree (token);


--
-- TOC entry 4969 (class 1259 OID 34794)
-- Name: product_categories_productId_categoryId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "product_categories_productId_categoryId_key" ON public.product_categories USING btree ("productId", "categoryId");


--
-- TOC entry 4966 (class 1259 OID 34764)
-- Name: session_products_sessionId_productId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "session_products_sessionId_productId_key" ON public.session_products USING btree ("sessionId", "productId");


--
-- TOC entry 4997 (class 1259 OID 56094)
-- Name: trusted_devices_jti_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX trusted_devices_jti_key ON public.trusted_devices USING btree (jti);


--
-- TOC entry 4996 (class 1259 OID 48980)
-- Name: two_factor_codes_tempToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "two_factor_codes_tempToken_key" ON public.two_factor_codes USING btree ("tempToken");


--
-- TOC entry 4946 (class 1259 OID 34714)
-- Name: users_login_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_login_key ON public.users USING btree (login);


--
-- TOC entry 5028 (class 2606 OID 50976)
-- Name: activity_form_configs activity_form_configs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_form_configs
    ADD CONSTRAINT "activity_form_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5011 (class 2606 OID 34746)
-- Name: booking_history booking_history_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_history
    ADD CONSTRAINT "booking_history_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5019 (class 2606 OID 34869)
-- Name: booking_notes booking_notes_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_notes
    ADD CONSTRAINT "booking_notes_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5007 (class 2606 OID 34775)
-- Name: bookings bookings_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5008 (class 2606 OID 34886)
-- Name: bookings bookings_resellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES public.resellers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5009 (class 2606 OID 34736)
-- Name: bookings bookings_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5021 (class 2606 OID 34961)
-- Name: email_templates email_templates_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT "email_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5024 (class 2606 OID 46390)
-- Name: equipment_lists equipment_lists_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_lists
    ADD CONSTRAINT "equipment_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5012 (class 2606 OID 34956)
-- Name: gift_vouchers gift_vouchers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gift_vouchers
    ADD CONSTRAINT "gift_vouchers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5023 (class 2606 OID 34966)
-- Name: newsletter newsletter_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.newsletter
    ADD CONSTRAINT "newsletter_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5017 (class 2606 OID 34825)
-- Name: participants participants_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT "participants_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5025 (class 2606 OID 48982)
-- Name: password_resets password_resets_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5010 (class 2606 OID 34741)
-- Name: payments payments_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5015 (class 2606 OID 34800)
-- Name: product_categories product_categories_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT "product_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5016 (class 2606 OID 34795)
-- Name: product_categories product_categories_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT "product_categories_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5004 (class 2606 OID 46385)
-- Name: products products_equipmentListId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_equipmentListId_fkey" FOREIGN KEY ("equipmentListId") REFERENCES public.equipment_lists(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5005 (class 2606 OID 34716)
-- Name: products products_guideId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5018 (class 2606 OID 34849)
-- Name: promo_code_usages promo_code_usages_voucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_code_usages
    ADD CONSTRAINT "promo_code_usages_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES public.gift_vouchers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5020 (class 2606 OID 34951)
-- Name: resellers resellers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resellers
    ADD CONSTRAINT "resellers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5013 (class 2606 OID 34770)
-- Name: session_products session_products_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_products
    ADD CONSTRAINT "session_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5014 (class 2606 OID 34765)
-- Name: session_products session_products_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_products
    ADD CONSTRAINT "session_products_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5006 (class 2606 OID 34731)
-- Name: sessions sessions_guideId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5022 (class 2606 OID 38492)
-- Name: settings settings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5027 (class 2606 OID 48992)
-- Name: trusted_devices trusted_devices_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT "trusted_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5026 (class 2606 OID 48987)
-- Name: two_factor_codes two_factor_codes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.two_factor_codes
    ADD CONSTRAINT "two_factor_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5003 (class 2606 OID 34946)
-- Name: users users_teamLeaderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 5205 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2025-12-09 09:12:22

--
-- PostgreSQL database dump complete
--

\unrestrict yPrsrNO5kTFjyMPXUUoTkkjedZj9NPZ7pw60gk2LBnroyqtgDsssPMnlLHzcpWs

