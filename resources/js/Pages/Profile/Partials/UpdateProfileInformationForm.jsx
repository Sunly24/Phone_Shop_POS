import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";
import { Transition, Dialog } from "@headlessui/react";
import { Link, useForm, usePage } from "@inertiajs/react";
import { useState, useRef, Fragment } from "react";
import { ReactCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = "",
}) {
    const user = usePage().props.auth.user;
    const [isEditing, setIsEditing] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [crop, setCrop] = useState({
        unit: "%",
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        aspect: 1,
    });
    const [completedCrop, setCompletedCrop] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [croppedImageUrl, setCroppedImageUrl] = useState(null);
    const photoInput = useRef(null);
    const imgRef = useRef(null);

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            _method: "PATCH",
            name: user.name,
            email: user.email,
            photo: null,
        });

    const submit = (e) => {
        e.preventDefault();

        post(route("profile.update"), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                if (photoInput.current) {
                    photoInput.current.value = "";
                }
            },
            onError: (errors) => {
                
            },
        });
    };

    const selectNewPhoto = () => {
        photoInput.current?.click();
    };

    const updatePhotoPreview = () => {
        const photo = photoInput.current?.files[0];

        if (!photo) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setPhotoPreview(e.target.result);
            setShowCropper(true);
        };
        reader.readAsDataURL(photo);
    };

    const getCroppedImg = async (image, crop) => {
        if (!crop || !image) {
            return null;
        }

        const canvas = document.createElement("canvas");
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext("2d");

        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(
            canvas.width / 2,
            canvas.height / 2,
            canvas.width / 2,
            0,
            2 * Math.PI
        );
        ctx.clip();

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    resolve(blob);
                },
                "image/jpeg",
                1
            );
        });
    };

    const onCropComplete = (crop, percentCrop) => {
        setCompletedCrop(crop);
    };

    const handleCropSave = async () => {
        if (!completedCrop || !imgRef.current) return;

        try {
            const croppedImg = await getCroppedImg(
                imgRef.current,
                completedCrop
            );
            if (!croppedImg) {
                return;
            }

            const croppedFile = new File([croppedImg], "cropped-image.jpg", {
                type: "image/jpeg",
            });

            // Create a preview URL for immediate display
            const previewUrl = URL.createObjectURL(croppedImg);
            setCroppedImageUrl(previewUrl);
            setPhotoPreview(previewUrl);

            setData("photo", croppedFile);
            setShowCropper(false);

            // Submit the form with the cropped photo
            post(route("profile.update"), {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    if (photoInput.current) {
                        photoInput.current.value = "";
                    }
                },
                onError: (errors) => {
                    
                },
            });
        } catch (error) {
            
        }
    };

    const deletePhoto = () => {
        post(route("current-user-photo.destroy"), {
            preserveScroll: true,
            onSuccess: () => {
                setPhotoPreview(null);
                setCroppedImageUrl(null);
                setData("photo", null);
                if (photoInput.current) {
                    photoInput.current.value = "";
                }
            },
        });
    };

    return (
        <section className={className}>
            <div className="flex justify-between mb-4">
                <div>
                    <p className="text-sm text-gray-600">
                        Update your account's profile information and email
                        address.
                    </p>
                </div>
                {/* Edit button */}
                <div className="flex justify-end mb-4">
                    <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                        {isEditing ? (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                                Cancel
                            </>
                        ) : (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                </svg>
                                Edit Profile
                            </>
                        )}
                    </button>
                </div>
            </div>

            <form
                onSubmit={submit}
                className="mt-6 space-y-6"
                encType="multipart/form-data"
            >
                {/* Profile Photo Display - Always visible */}
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-full shrink-0 overflow-hidden bg-gray-100">
                        <img
                            src={
                                croppedImageUrl ||
                                photoPreview ||
                                user.avatar_url ||
                                user.profile_photo_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    user.name
                                )}&color=7F9CF5&background=EBF4FF`
                            }
                            alt={user.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                                // Fallback to ui-avatars if image fails to load (silent)
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    user.name
                                )}&color=7F9CF5&background=EBF4FF`;
                            }}
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-900 font-medium text-sm">
                            {user.name}
                        </span>
                        <span className="text-gray-500 text-sm capitalize">
                            {user.roles?.[0]?.name || "User"}
                        </span>
                    </div>
                </div>

                {isEditing && (
                    <>
                        {/* Photo Upload Controls */}
                        <div>
                            <input
                                type="file"
                                className="hidden"
                                ref={photoInput}
                                onChange={updatePhotoPreview}
                                accept="image/*"
                            />

                            <div className="mt-2 flex gap-2">
                                <SecondaryButton
                                    type="button"
                                    className="mr-2"
                                    onClick={selectNewPhoto}
                                >
                                    Select A New Photo
                                </SecondaryButton>

                                {(user.profile_photo_path || photoPreview) && (
                                    <SecondaryButton
                                        type="button"
                                        className="bg-red-500 hover:bg-red-600 focus:bg-red-600 text-white"
                                        onClick={deletePhoto}
                                    >
                                        Remove Photo
                                    </SecondaryButton>
                                )}
                            </div>

                            <InputError
                                message={errors.photo}
                                className="mt-2"
                            />
                        </div>

                        {/* Image Cropper Dialog */}
                        <Transition appear show={showCropper} as={Fragment}>
                            <Dialog
                                as="div"
                                className="relative z-10"
                                onClose={() => setShowCropper(false)}
                            >
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0"
                                    enterTo="opacity-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <div className="fixed inset-0 bg-black/25" />
                                </Transition.Child>

                                <div className="fixed inset-0 overflow-y-auto">
                                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                                        <Transition.Child
                                            as={Fragment}
                                            enter="ease-out duration-300"
                                            enterFrom="opacity-0 scale-95"
                                            enterTo="opacity-100 scale-100"
                                            leave="ease-in duration-200"
                                            leaveFrom="opacity-100 scale-100"
                                            leaveTo="opacity-0 scale-95"
                                        >
                                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                                <Dialog.Title
                                                    as="h3"
                                                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                                                >
                                                    Crop Profile Photo
                                                </Dialog.Title>
                                                <div className="mt-2">
                                                    <ReactCrop
                                                        crop={crop}
                                                        onChange={(
                                                            _,
                                                            percentCrop
                                                        ) =>
                                                            setCrop(percentCrop)
                                                        }
                                                        onComplete={
                                                            onCropComplete
                                                        }
                                                        aspect={1}
                                                        circularCrop
                                                    >
                                                        <img
                                                            ref={imgRef}
                                                            src={photoPreview}
                                                            alt="Crop preview"
                                                            style={{
                                                                maxWidth:
                                                                    "100%",
                                                            }}
                                                        />
                                                    </ReactCrop>
                                                </div>

                                                <div className="mt-4 flex justify-end gap-2">
                                                    <SecondaryButton
                                                        type="button"
                                                        onClick={() =>
                                                            setShowCropper(
                                                                false
                                                            )
                                                        }
                                                    >
                                                        Cancel
                                                    </SecondaryButton>
                                                    <PrimaryButton
                                                        type="button"
                                                        onClick={handleCropSave}
                                                    >
                                                        Save
                                                    </PrimaryButton>
                                                </div>
                                            </Dialog.Panel>
                                        </Transition.Child>
                                    </div>
                                </div>
                            </Dialog>
                        </Transition>
                    </>
                )}

                {/* Name */}
                <div>
                    <InputLabel htmlFor="name" value="Name" />
                    {isEditing ? (
                        <TextInput
                            id="name"
                            type="text"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            required
                            autoComplete="name"
                        />
                    ) : (
                        <div className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                            {data.name}
                        </div>
                    )}
                    {isEditing && (
                        <InputError className="mt-2" message={errors.name} />
                    )}
                </div>

                {/* Email */}
                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    {isEditing ? (
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            required
                            autoComplete="username"
                        />
                    ) : (
                        <div className="mt-1 block w-full p-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                            {data.email}
                        </div>
                    )}
                    {isEditing && (
                        <InputError className="mt-2" message={errors.email} />
                    )}

                    {mustVerifyEmail && user.email_verified_at === null && (
                        <div>
                            <p className="text-sm mt-2 text-gray-800">
                                Your email address is unverified.
                                <Link
                                    href={route("verification.send")}
                                    method="post"
                                    as="button"
                                    className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Click here to re-send the verification
                                    email.
                                </Link>
                            </p>

                            {status === "verification-link-sent" && (
                                <div className="mt-2 font-medium text-sm text-green-600">
                                    A new verification link has been sent to
                                    your email address.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isEditing && (
                    <div className="flex items-center gap-4">
                        <PrimaryButton disabled={processing}>
                            Save
                        </PrimaryButton>

                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm text-gray-600">Saved.</p>
                        </Transition>
                    </div>
                )}
            </form>
        </section>
    );
}
