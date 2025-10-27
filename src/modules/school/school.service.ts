import { Service } from "@/decorators";
import db from "@/drizzle/db";
import { AppLogger } from "@/lib/logger";
import { eq } from "drizzle-orm";
import { school } from "./entities/school.schema";
import type { CreateSchoolRequestDTO } from "./interfaces/createSchool.dto";
import type { ListSchoolsQueryDTO } from "./interfaces/listSchools.dto";
import type { UpdateSchoolRequestDTO } from "./interfaces/updateSchool.dto";






/**
 * SchoolService
 * Service class for handling school business logic
 * Private service - only accessible within this module
 */
@Service()
export class SchoolService {
  constructor(private readonly logger: AppLogger) {
    this.logger.info("SchoolService initialized");
  }

  /**
   * Retrieves all school records from the database
   * @returns Array of all school records
   */
  async getAll() {
    this.logger.info("Fetching all school");
    const results = await db.select().from(school);
    return results;
  }

  /**
   * Retrieves paginated school records from the database
   * @param query - Pagination parameters (page, limit)
   * @returns Paginated array of school records
   */
  async getAllPaginated(query: ListSchoolsQueryDTO) {
    this.logger.info(`Fetching paginated school - Page: ${query.page}, Limit: ${query.limit}`);
    const page = parseInt(query.page);
    const limit = parseInt(query.limit);
    const offset = (page - 1) * limit;

    const results = await db
      .select()
      .from(school)
      .limit(limit)
      .offset(offset);

    return results;
  }

  /**
   * Retrieves a single school record by ID
   * @param id - UUID of the school to retrieve
   * @returns The school record or null if not found
   */
  async getById(id: string) {
    this.logger.info(`Fetching school with ID: ${id}`);
    const result = await db
      .select()
      .from(school)
      .where(eq(school.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Creates a new school record in the database
   * @param data - The data for creating a new school
   * @returns The newly created school record
   */
  async create(data: CreateSchoolRequestDTO) {
    this.logger.info(`Creating new school: ${JSON.stringify(data)}`);
    const result = await db
      .insert(school)
      .values(data)
      .returning();

    return result[0];
  }

  /**
   * Updates an existing school record in the database
   * @param id - UUID of the school to update
   * @param data - The data to update
   * @returns The updated school record or null if not found
   */
  async update(id: string, data: UpdateSchoolRequestDTO) {
    this.logger.info(`Updating school with ID: ${id}`);
    const result = await db
      .update(school)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(school.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Deletes a school record from the database
   * @param id - UUID of the school to delete
   * @returns The deleted school record or null if not found
   */
  async delete(id: string) {
    this.logger.info(`Deleting school with ID: ${id}`);
    const result = await db
      .delete(school)
      .where(eq(school.id, id))
      .returning();

    return result[0] || null;
  }
}
