import { FileStorage } from "../../../../shared-kernel/domain/ports/FileStorage";
import { UserNotFoundException } from "../../../domain/exceptions/UserNotFoundException";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export interface UpdateProfileAvatarFile {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}

export interface UpdateProfileInput {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarFile?: UpdateProfileAvatarFile | null;
}

export interface UpdateProfileResult {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
}

export class UpdateProfile {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: UpdateProfileInput): Promise<UpdateProfileResult> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    let avatarUrl = user.avatarUrl;
    if (input.avatarFile) {
      const uploaded = await this.fileStorage.save({
        buffer: input.avatarFile.buffer,
        mimeType: input.avatarFile.mimeType,
        originalName: input.avatarFile.originalName,
        folder: "avatars",
      });
      avatarUrl = uploaded.url;
    }

    user.updateProfile({
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      avatarUrl,
    });
    await this.userRepository.save(user);

    return {
      id: user.id,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      avatarUrl,
    };
  }
}
