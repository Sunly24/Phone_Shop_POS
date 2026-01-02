<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\UpdatesUserProfileInformation;

class UpdateUserProfileInformation implements UpdatesUserProfileInformation
{
    /**
     * Validate and update the given user's profile information.
     *
     * @param  array<string, mixed>  $input
     */
    public function update(User $user, array $input): void
    {
        $rules = [];

        // Only validate fields that are present in the input
        if (isset($input['name'])) {
            $rules['name'] = ['required', 'string', 'max:255'];
        }
        if (isset($input['email'])) {
            $rules['email'] = ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)];
        }
        if (isset($input['photo'])) {
            $rules['photo'] = ['required', 'image', 'mimes:jpg,jpeg,png', 'max:1024'];
        }

        Validator::make($input, $rules)->validateWithBag('updateProfileInformation');

        // Handle photo update
        if (isset($input['photo'])) {
            $user->updateProfilePhoto($input['photo']);
        }

        // Prepare the fields to update
        $fieldsToUpdate = [];
        if (isset($input['name'])) {
            $fieldsToUpdate['name'] = $input['name'];
        }
        if (isset($input['email'])) {
            $fieldsToUpdate['email'] = $input['email'];
        }

        // Only update profile information if there are fields to update
        if (!empty($fieldsToUpdate)) {
            if (
                isset($input['email']) &&
                $input['email'] !== $user->email &&
                $user instanceof MustVerifyEmail
            ) {
                $this->updateVerifiedUser($user, $fieldsToUpdate);
            } else {
                $user->forceFill($fieldsToUpdate)->save();
            }
        }
    }

    /**
     * Update the given verified user's profile information.
     *
     * @param  array<string, string>  $input
     */
    protected function updateVerifiedUser(User $user, array $input): void
    {
        $user->forceFill([
            'name' => $input['name'],
            'email' => $input['email'],
            'email_verified_at' => null,
        ])->save();

        $user->sendEmailVerificationNotification();
    }
}
