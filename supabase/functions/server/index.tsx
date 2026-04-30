import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const BASE_PATH = "/make-server-e1ac9291";
const IMPORT_SECRET = Deno.env.get("IMPORT_SECRET") ?? "";

type AllowedAttendee = {
  email: string;
  full_name: string | null;
  attends_interclubes: boolean | null;
  is_active: boolean | null;
};

type ActivityRecord = {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime?: string | null;
  location: string;
  assignedEmails?: string[];
  audience?: "all" | "interclubes" | "custom";
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "x-import-secret"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const supabaseClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const getUserByToken = async (accessToken: string) => {
  const supabase = supabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return null;
  }
  return user;
};

const getAllowedAttendee = async (email: string): Promise<AllowedAttendee | null> => {
  const supabase = supabaseClient();
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await supabase
    .from("attendees")
    .select("email, full_name, attends_interclubes, is_active")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.is_active === false) {
    return null;
  }

  return data as AllowedAttendee;
};

const canUserSeeActivity = (activity: ActivityRecord, userEmail: string, attendsInterclubes: boolean) => {
  const normalizedUserEmail = normalizeEmail(userEmail);
  const assignedEmails = (activity.assignedEmails ?? []).map(normalizeEmail);

  if (assignedEmails.length > 0) {
    return assignedEmails.includes(normalizedUserEmail);
  }

  if (activity.audience === "interclubes") {
    return attendsInterclubes;
  }

  return true;
};

// Health check endpoint
app.get(`${BASE_PATH}/health`, (c) => {
  return c.json({ status: "ok" });
});

// ============ AUTH ROUTES ============

// Sign up route
app.post(`${BASE_PATH}/signup`, async (c) => {
  try {
    const supabase = supabaseClient();
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const allowedAttendee = await getAllowedAttendee(email);
    if (!allowedAttendee) {
      return c.json({ error: "Tu correo no esta habilitado para registrarse." }, 403);
    }

    const normalizedEmail = normalizeEmail(email);
    const profileName = (allowedAttendee.full_name ?? name).trim();
    const attendsInterclubes = allowedAttendee.attends_interclubes ?? false;

    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      user_metadata: { name: profileName, attendsInterclubes },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Error during user signup for email ${email}: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Save user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: normalizedEmail,
      name: profileName,
      attendsInterclubes,
    });

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log(`Unexpected error during signup: ${error}`);
    return c.json({ error: "Signup failed" }, 500);
  }
});

// Get user profile
app.get(`${BASE_PATH}/profile`, async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "Unauthorized - No token provided" }, 401);
    }

    const user = await getUserByToken(accessToken);
    if (!user || !user.email) {
      console.log("Authorization error while getting user profile");
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allowedAttendee = await getAllowedAttendee(user.email);
    if (!allowedAttendee) {
      return c.json({ error: "Tu correo no esta habilitado para esta aplicacion." }, 403);
    }

    const profile = await kv.get(`user:${user.id}`);
    const profileData = {
      id: user.id,
      email: normalizeEmail(user.email),
      name: allowedAttendee.full_name || profile?.name || user.user_metadata?.name || "Usuario",
      attendsInterclubes: allowedAttendee.attends_interclubes ?? false,
    };

    await kv.set(`user:${user.id}`, profileData);
    if (!profile) {
      return c.json(profileData);
    }

    return c.json(profileData);
  } catch (error) {
    console.log(`Error fetching user profile: ${error}`);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

// Update user profile
app.put(`${BASE_PATH}/profile`, async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "Unauthorized - No token provided" }, 401);
    }

    const user = await getUserByToken(accessToken);
    if (!user || !user.email) {
      console.log("Authorization error while updating user profile");
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allowedAttendee = await getAllowedAttendee(user.email);
    if (!allowedAttendee) {
      return c.json({ error: "Tu correo no esta habilitado para esta aplicacion." }, 403);
    }

    const { name } = await c.req.json();

    const currentProfile = await kv.get(`user:${user.id}`) || {};
    const updatedProfile = {
      ...currentProfile,
      id: user.id,
      email: normalizeEmail(user.email),
      ...(name !== undefined && { name }),
      attendsInterclubes: allowedAttendee.attends_interclubes ?? false,
    };

    await kv.set(`user:${user.id}`, updatedProfile);

    return c.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.log(`Error updating user profile: ${error}`);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

// ============ ACTIVITIES ROUTES ============

// Get all activities
app.get(`${BASE_PATH}/activities`, async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "Unauthorized - No token provided" }, 401);
    }

    const user = await getUserByToken(accessToken);
    if (!user || !user.email) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allowedAttendee = await getAllowedAttendee(user.email);
    if (!allowedAttendee) {
      return c.json({ error: "Tu correo no esta habilitado para esta aplicacion." }, 403);
    }

    const activities = (await kv.getByPrefix('activity:')) as ActivityRecord[];
    const visibleActivities = activities.filter((activity) =>
      canUserSeeActivity(
        activity,
        user.email ?? "",
        allowedAttendee.attends_interclubes ?? false,
      ),
    );

    return c.json(visibleActivities.sort((a, b) => {
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return timeA - timeB;
    }));
  } catch (error) {
    console.log(`Error fetching activities: ${error}`);
    return c.json({ error: "Failed to fetch activities" }, 500);
  }
});

// Create activity (requires auth)
app.post(`${BASE_PATH}/activities`, async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "Unauthorized - No token provided" }, 401);
    }

    const user = await getUserByToken(accessToken);
    if (!user) {
      console.log("Authorization error while creating activity");
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { title, description, startTime, endTime, location, assignedEmails, audience } = await c.req.json();

    if (!title || !startTime) {
      return c.json({ error: "Title and start time are required" }, 400);
    }

    const activityId = crypto.randomUUID();
    const activity = {
      id: activityId,
      title,
      description: description || '',
      startTime,
      endTime: endTime || null,
      location: location || '',
      assignedEmails: Array.isArray(assignedEmails) ? assignedEmails.map(normalizeEmail) : [],
      audience: audience || "all",
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`activity:${activityId}`, activity);

    return c.json({ success: true, activity });
  } catch (error) {
    console.log(`Error creating activity: ${error}`);
    return c.json({ error: "Failed to create activity" }, 500);
  }
});

// Import activities from Google Sheets (protected with IMPORT_SECRET)
app.post(`${BASE_PATH}/activities/import`, async (c) => {
  try {
    const secret = c.req.header("x-import-secret");
    if (!IMPORT_SECRET || secret !== IMPORT_SECRET) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const body = await c.req.json();
    const activities = Array.isArray(body?.activities) ? body.activities : [];

    if (activities.length === 0) {
      return c.json({ error: "activities is required and must be a non-empty array" }, 400);
    }

    let imported = 0;
    for (const row of activities) {
      if (!row?.title || !row?.startTime) {
        continue;
      }

      const activityId = row.id || crypto.randomUUID();
      const normalizedAssignedEmails = Array.isArray(row.assignedEmails)
        ? row.assignedEmails.map((email: string) => normalizeEmail(email))
        : row.email
          ? [normalizeEmail(row.email)]
          : [];

      const record: ActivityRecord = {
        id: activityId,
        title: row.title,
        description: row.description || "",
        startTime: row.startTime,
        endTime: row.endTime || null,
        location: row.location || "",
        assignedEmails: normalizedAssignedEmails,
        audience: row.audience || (normalizedAssignedEmails.length > 0 ? "custom" : "all"),
        updatedAt: new Date().toISOString(),
      };

      await kv.set(`activity:${activityId}`, record);
      imported += 1;
    }

    return c.json({ success: true, imported });
  } catch (error) {
    console.log(`Error importing activities: ${error}`);
    return c.json({ error: "Failed to import activities" }, 500);
  }
});

// Update activity (requires auth)
app.put(`${BASE_PATH}/activities/:id`, async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "Unauthorized - No token provided" }, 401);
    }

    const user = await getUserByToken(accessToken);
    if (!user) {
      console.log("Authorization error while updating activity");
      return c.json({ error: "Unauthorized" }, 401);
    }

    const activityId = c.req.param('id');
    const updates = await c.req.json();

    const currentActivity = await kv.get(`activity:${activityId}`);
    if (!currentActivity) {
      return c.json({ error: "Activity not found" }, 404);
    }

    const updatedActivity = {
      ...currentActivity,
      ...updates,
      id: activityId,
      ...(updates?.assignedEmails !== undefined && {
        assignedEmails: Array.isArray(updates.assignedEmails)
          ? updates.assignedEmails.map(normalizeEmail)
          : [],
      }),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`activity:${activityId}`, updatedActivity);

    return c.json({ success: true, activity: updatedActivity });
  } catch (error) {
    console.log(`Error updating activity: ${error}`);
    return c.json({ error: "Failed to update activity" }, 500);
  }
});

// Delete activity (requires auth)
app.delete(`${BASE_PATH}/activities/:id`, async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "Unauthorized - No token provided" }, 401);
    }

    const user = await getUserByToken(accessToken);
    if (!user) {
      console.log("Authorization error while deleting activity");
      return c.json({ error: "Unauthorized" }, 401);
    }

    const activityId = c.req.param('id');
    await kv.del(`activity:${activityId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting activity: ${error}`);
    return c.json({ error: "Failed to delete activity" }, 500);
  }
});

// ============ LOCATIONS ROUTES ============

// Get locations (service and interclubes)
app.get(`${BASE_PATH}/locations`, async (c) => {
  try {
    const locations = await kv.mget(['location:service', 'location:interclubes']);
    return c.json({
      service: locations[0] || { lat: 0, lng: 0, name: 'Ubicación del Servicio' },
      interclubes: locations[1] || { lat: 0, lng: 0, name: 'Ubicación de Interclubes' },
    });
  } catch (error) {
    console.log(`Error fetching locations: ${error}`);
    return c.json({ error: "Failed to fetch locations" }, 500);
  }
});

// Update location (requires auth)
app.put(`${BASE_PATH}/locations/:type`, async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: "Unauthorized - No token provided" }, 401);
    }

    const user = await getUserByToken(accessToken);
    if (!user) {
      console.log("Authorization error while updating location");
      return c.json({ error: "Unauthorized" }, 401);
    }

    const locationType = c.req.param('type');
    if (locationType !== 'service' && locationType !== 'interclubes') {
      return c.json({ error: "Invalid location type" }, 400);
    }

    const { lat, lng, name } = await c.req.json();

    if (lat === undefined || lng === undefined) {
      return c.json({ error: "Latitude and longitude are required" }, 400);
    }

    const location = { lat, lng, name: name || `Ubicación de ${locationType}` };
    await kv.set(`location:${locationType}`, location);

    return c.json({ success: true, location });
  } catch (error) {
    console.log(`Error updating location: ${error}`);
    return c.json({ error: "Failed to update location" }, 500);
  }
});

Deno.serve(app.fetch);