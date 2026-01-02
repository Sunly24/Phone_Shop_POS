<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;
use OwenIt\Auditing\Models\Audit;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Jetstream\HasProfilePhoto;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements AuditableContract, MustVerifyEmail
{
    use HasApiTokens;
    use HasFactory;
    use HasProfilePhoto;
    use Notifiable;
    use TwoFactorAuthenticatable;
    use HasRoles;
    use \OwenIt\Auditing\Auditable;

    protected $auditInclude = ['name', 'email'];

    protected static $logAttributes = ['name', 'email'];

    protected static $logOnlyDirty = true;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'email_verified_at',
        'profile_photo_path',
        'is_active',
        'blocked_at',
        'block_reason',
        'google_id',
        'google_avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'profile_photo_url',
        'avatar_url',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'blocked_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function auditEvent($event)
    {
        $this->audit_event = $event;
        return $this->auditEvent([
            'event' => $event,
            'url' => request()->fullUrl(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent()
        ]);
    }

    /**
     * Get the default profile photo URL if no profile photo has been uploaded.
     *
     * @return string
     */
    protected function defaultProfilePhotoUrl(): string
    {
        $name = trim(collect(explode(' ', $this->name))->map(function ($segment) {
            return mb_substr($segment, 0, 1);
        })->join(' '));

        return 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&color=7F9CF5&background=EBF4FF';
    }

    /**
     * Get the user's avatar URL (Google avatar if available, otherwise profile photo or default)
     *
     * @return string
     */
    public function getAvatarUrlAttribute(): string
    {
        // First priority: Google avatar
        if ($this->google_avatar) {
            return $this->google_avatar;
        }

        // Second priority: Uploaded profile photo
        if ($this->profile_photo_path) {
            return asset('storage/' . $this->profile_photo_path);
        }

        // Fallback: Default generated avatar
        return $this->defaultProfilePhotoUrl();
    }

    /**
     * Update the user's profile photo.
     *
     * @param  \Illuminate\Http\UploadedFile  $photo
     * @return void
     * @throws \Exception If the photo cannot be stored
     */
    public function updateProfilePhoto($photo)
    {
        if ($photo && $photo->isValid()) {
            $filename = 'profile-photos/' . $this->id . '_' . time() . '.' . $photo->getClientOriginalExtension();

            try {
                Log::info('Attempting to store profile photo', [
                    'user_id' => $this->id,
                    'filename' => $filename,
                    'original_name' => $photo->getClientOriginalName(),
                    'mime_type' => $photo->getMimeType(),
                    'size' => $photo->getSize()
                ]);

                // Ensure the profile-photos directory exists
                Storage::disk('public')->makeDirectory('profile-photos');

                // Store the new photo using putFileAs instead of storeAs
                $result = Storage::disk('public')->putFileAs(
                    'profile-photos',
                    $photo,
                    basename($filename)
                );

                Log::info('Store result', ['success' => $result]);

                if (!$result) {
                    throw new \Exception('Failed to store the photo.');
                }

                // If storage succeeded, update the model
                $oldPhotoPath = $this->profile_photo_path;

                $this->forceFill([
                    'profile_photo_path' => $filename,
                ])->save();

                Log::info('Profile photo path updated', [
                    'old_path' => $oldPhotoPath,
                    'new_path' => $filename
                ]);

                // Only delete the old photo after successfully saving the new one
                if ($oldPhotoPath) {
                    Storage::disk('public')->delete($oldPhotoPath);
                    Log::info('Old photo deleted', ['path' => $oldPhotoPath]);
                }
            } catch (\Exception $e) {
                // If anything fails, clean up the new photo if it was stored
                Storage::disk('public')->delete($filename);
                Log::error('Failed to update profile photo', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw $e;
            }
        } else {
            Log::warning('Invalid photo provided', [
                'is_null' => is_null($photo),
                'is_valid' => $photo ? $photo->isValid() : false
            ]);
            throw new \Exception('The provided photo is invalid.');
        }
    }

    /**
     * Get the URL to the user's profile photo.
     *
     * @return string
     */
    public function getProfilePhotoUrlAttribute()
    {
        // First priority: Google avatar
        if ($this->google_avatar) {
            return $this->google_avatar;
        }

        // Second priority: Uploaded profile photo
        if ($this->profile_photo_path) {
            // Use Laravel's asset() helper which automatically uses APP_URL
            if (Storage::disk('public')->exists($this->profile_photo_path)) {
                return asset('storage/' . $this->profile_photo_path);
            }
        }

        // Fallback to default avatar
        return $this->defaultProfilePhotoUrl();
    }

    /**
     * Scope a query to only include active users.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include blocked users.
     */
    public function scopeBlocked($query)
    {
        return $query->where('is_active', false);
    }

    /**
     * Check if the user is currently active.
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Check if the user is currently blocked.
     */
    public function isBlocked(): bool
    {
        return !$this->is_active;
    }

    /**
     * Block the user.
     */
    public function block(string $reason = null): bool
    {
        return $this->update([
            'is_active' => false,
            'blocked_at' => now(),
            'block_reason' => $reason,
        ]);
    }

    /**
     * Unblock the user.
     */
    public function unblock(): bool
    {
        return $this->update([
            'is_active' => true,
            'blocked_at' => null,
            'block_reason' => null,
        ]);
    }

    /**
     * Toggle user status between active and blocked.
     */
    public function toggleStatus(string $reason = null): bool
    {
        if ($this->is_active) {
            return $this->block($reason);
        } else {
            return $this->unblock();
        }
    }
}
