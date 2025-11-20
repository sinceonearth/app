CREATE TABLE "airlines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airline_code" varchar(3) NOT NULL,
	"airline_name" varchar NOT NULL,
	"country" varchar NOT NULL,
	CONSTRAINT "airlines_airline_code_unique" UNIQUE("airline_code")
);
--> statement-breakpoint
CREATE TABLE "airports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ident" varchar NOT NULL,
	"type" varchar,
	"name" varchar,
	"latitude" double precision,
	"longitude" double precision,
	"elevation_ft" integer,
	"continent" varchar,
	"iso_country" varchar,
	"iso_region" varchar,
	"municipality" varchar,
	"gps_code" varchar,
	"iata" varchar(3),
	"icao" varchar(4),
	"local_code" varchar,
	CONSTRAINT "airports_ident_unique" UNIQUE("ident")
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"airline_name" varchar NOT NULL,
	"airline_code" varchar(3) NOT NULL,
	"flight_number" varchar NOT NULL,
	"departure" varchar NOT NULL,
	"arrival" varchar NOT NULL,
	"departure_latitude" double precision,
	"departure_longitude" double precision,
	"arrival_latitude" double precision,
	"arrival_longitude" double precision,
	"departure_time" varchar,
	"arrival_time" varchar,
	"date" varchar,
	"aircraft_type" varchar,
	"distance" double precision,
	"duration" varchar,
	"status" varchar DEFAULT 'scheduled',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stamps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alien" varchar NOT NULL,
	"username" varchar NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar,
	"name" varchar NOT NULL,
	"country" varchar,
	"profile_image_url" varchar,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_alien_unique" UNIQUE("alien"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "flights" ADD CONSTRAINT "flights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");