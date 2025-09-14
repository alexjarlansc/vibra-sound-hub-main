import { createClient } from '@supabase/supabase-js'

// Usage (PowerShell):
// $env:SUPABASE_URL = "https://<project>.supabase.co";
// $env:SUPABASE_SERVICE_ROLE_KEY = "<SERVICE_ROLE_KEY>";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. Set them and re-run.');
    process.exit(1);
}
// main().catch(err => { console.error('Fatal', err); process.exit(1) })


// CLI args: --bucket <name> --dry --user <id>
// CLI args: --bucket <name> --dry --user <id>
const argv = process.argv.slice(2);
const argIndex = (flag) => {
    const i = argv.indexOf(flag);
    return i === -1 ? -1 : i;
}
const bucketArgIndex = argIndex('--bucket');
const dryIndex = argIndex('--dry');
const userIndex = argIndex('--user');
const BUCKET_NAME = bucketArgIndex !== -1 && argv[bucketArgIndex + 1] ? argv[bucketArgIndex + 1] : 'avatars';
const DRY_RUN = dryIndex !== -1;
const TARGET_USER = userIndex !== -1 && argv[userIndex + 1] ? argv[userIndex + 1] : null;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});

function extractPublicUrl(res) {
    if (!res) return null;
    // try various shapes returned by different SDK versions
    return (res.data && (res.data.publicUrl || res.data.publicURL)) || res.publicUrl || res.publicURL || null;
}

function safeGetPublicUrl(bucket, path) {
    try {
        const res = supabase.storage.from(bucket).getPublicUrl(path);
        return extractPublicUrl(res);
    } catch (e) {
        return null;
    }
}

async function main() {
    console.log('Starting backfill of profiles.avatar_url');

    const batchSize = 100;
    let offset = 0;
    while (true) {
        let profiles = null;
        let error = null;

        if (TARGET_USER) {
            const res = await supabase.from('profiles').select('id, avatar_url, avatar_path').eq('id', TARGET_USER).limit(1);
            profiles = res.data;
            error = res.error;
        } else {
            const res = await supabase.from('profiles')
                .select('id, avatar_url, avatar_path')
                .or('avatar_url.is.null,avatar_url.eq=""')
                .order('id', { ascending: true })
                .range(offset, offset + batchSize - 1);
            profiles = res.data;
            error = res.error;
        }

        if (error) {
            console.error('Error fetching profiles:', error);
            process.exit(1);
        }

        if (!profiles || profiles.length === 0) break;

        for (const p of profiles) {
            try {
                // Try 1: avatar_path column -> public url
                if (p.avatar_path) {
                    const publicUrl = safeGetPublicUrl(BUCKET_NAME, p.avatar_path);
                    if (publicUrl) {
                        if (!DRY_RUN) {
                            const { error: updErr } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', p.id);
                            if (updErr) console.warn('Failed to update profile', p.id, updErr);
                            else console.log('Updated avatar_url for', p.id);
                        } else {
                            console.log('[DRY RUN] Would update', p.id, '->', publicUrl);
                        }
                        continue;
                    }
                }

                // Try 2: auth metadata (admin)
                let authAvatar = null;
                try {
                    if (supabase.auth && supabase.auth.admin && typeof supabase.auth.admin.getUserById === 'function') {
                        const adminRes = await supabase.auth.admin.getUserById(p.id);
                        const user = adminRes?.data?.user || adminRes?.data || adminRes;
                        authAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.avatar || user?.raw_user_meta_data?.avatar_url || null;
                    }
                } catch (e) {
                    // ignore
                }
                if (authAvatar) {
                    if (!DRY_RUN) {
                        const { error: updErr } = await supabase.from('profiles').update({ avatar_url: authAvatar }).eq('id', p.id);
                        if (updErr) console.warn('Failed to update profile with auth avatar', p.id, updErr);
                        else console.log('Updated avatar_url for', p.id, 'from auth.user_metadata');
                    } else {
                        console.log('[DRY RUN] Would update', p.id, 'from auth metadata ->', authAvatar);
                    }
                    continue;
                }

                // Try 3: list storage objects under <userId>/ and use first one
                try {
                    const listPath = `${p.id}/`;
                    const listRes = await supabase.storage.from(BUCKET_NAME).list(listPath, { limit: 10 });
                    const objects = listRes.data;
                    if (objects && objects.length) {
                        const first = objects[0];
                        const publicUrl = safeGetPublicUrl(BUCKET_NAME, `${p.id}/${first.name}`);
                        if (publicUrl) {
                            if (!DRY_RUN) {
                                const { error: updErr } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', p.id);
                                if (updErr) console.warn('Failed to update profile via storage list', p.id, updErr);
                                else console.log('Updated avatar_url for', p.id, 'from storage list');
                            } else {
                                console.log('[DRY RUN] Would update', p.id, 'from storage list ->', publicUrl);
                            }
                            continue;
                        }
                    }
                } catch (e) { /* ignore */ }

                console.log('No avatar found for', p.id);
            } catch (err) {
                console.error('Error processing profile', p.id, err);
            }
        }

        if (profiles.length < batchSize) break;
        offset += batchSize;
    }

    console.log('Backfill completed');
}

main().catch(err => { console.error('Fatal', err); process.exit(1); });