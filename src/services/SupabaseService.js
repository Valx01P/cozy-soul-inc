import supabase from './supabase'; // Adjust the path to your Supabase client setup

/**
 * A class to interact with a Supabase database and storage buckets.
 * Provides methods for CRUD operations on tables and managing files in storage.
 * 
 * @example
 * // Initialize the service
 * import SupabaseService from './SupabaseService';
 * const postService = new SupabaseService('posts');
 * 
 * // Database method examples
 * const allPosts = await postService.get_all();
 * const pagePosts = await postService.get_paginated_data_basic(5, 1);
 * const taggedPosts = await postService.get_paginated_data_where(10, 0, { category: 'tech' });
 * const sortedPosts = await postService.get_paginated_data_where_order(10, 0, { user_id: 2 }, 'date', false);
 * const post = await postService.get_by_id(3);
 * const newPost = await postService.save({ title: 'Hello', body: 'World' });
 * const updated = await postService.update(3, { title: 'Hi Updated' });
 * const deleted = await postService.delete(5);
 * const postsByCat = await postService.get_by_field('category', 'tech');
 * const filteredPosts = await postService.get_by_fields({ user_id: 2, status: 'active' });
 * const deletedByCat = await postService.delete_by_field('category', 'old');
 * 
 * // Storage method examples
 * const file = // your file object (e.g., from an input);
 * await postService.upload_image('avatars', 'user1.jpg', file, 'image/jpeg');
 * const avatarUrl = postService.get_image_url('avatars', 'user1.jpg');
 * await postService.delete_image('avatars', 'user1.jpg');
 * await postService.upload_multiple_images('gallery', [
 *   { fileName: 'pic1.png', file: file1, contentType: 'image/png' },
 *   { fileName: 'pic2.png', file: file2, contentType: 'image/png' },
 * ]);
 * await postService.delete_multiple_images('gallery', ['pic1.png', 'pic2.png']);
 */
class SupabaseService {
  /**
   * Constructor to set the table name
   * @param {string} table - The name of the table in the Supabase database
   * @example
   * const userService = new SupabaseService('users');
   */
  constructor(table) {
    this.table = table;
  }

  // --- Database Methods ---

  /**
   * Get all records from the table
   * @returns {Promise<Array>} - Array of all records
   * @throws {Error} - If the query fails
   * @example
   * const allUsers = await userService.get_all();
   * console.log(allUsers); // Logs all user records
   */
  async get_all() {
    const { data, error } = await supabase.from(this.table).select('*');
    if (error) throw new Error(`Error fetching all records: ${error.message}`);
    return data;
  }

  /**
   * Get paginated data from the table
   * @param {number} limit - Number of records per page
   * @param {number} page - Page number (0-based)
   * @returns {Promise<Array>} - Paginated records
   * @throws {Error} - If the query fails
   * @example
   * const pageOne = await postService.get_paginated_data_basic(10, 0);
   * console.log(pageOne); // Logs first 10 posts
   */
  async get_paginated_data_basic(limit, page) {
    const start = page * limit;
    const end = start + limit - 1;
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .range(start, end);
    if (error) throw new Error(`Error fetching paginated data: ${error.message}`);
    return data;
  }

  /**
   * Get paginated data with a WHERE clause
   * @param {number} limit - Number of records per page
   * @param {number} page - Page number (0-based)
   * @param {Object} where - Key-value pairs for WHERE conditions
   * @returns {Promise<Array>} - Paginated records matching conditions
   * @throws {Error} - If the query fails
   * @example
   * const techPosts = await postService.get_paginated_data_where(5, 1, { category: 'tech' });
   * console.log(techPosts); // Logs 5 tech posts from page 1
   */
  async get_paginated_data_where(limit, page, where) {
    const start = page * limit;
    const end = start + limit - 1;
    let query = supabase.from(this.table).select('*');
    for (const [key, value] of Object.entries(where)) {
      query = query.eq(key, value);
    }
    const { data, error } = await query.range(start, end);
    if (error) throw new Error(`Error fetching paginated data with WHERE: ${error.message}`);
    return data;
  }

  /**
   * Get paginated data with WHERE and ORDER BY clauses
   * @param {number} limit - Number of records per page
   * @param {number} page - Page number (0-based)
   * @param {Object} where - Key-value pairs for WHERE conditions
   * @param {string} orderBy - Column to order by
   * @param {boolean} [ascending=true] - Order direction (true for ASC, false for DESC)
   * @returns {Promise<Array>} - Paginated, ordered records matching conditions
   * @throws {Error} - If the query fails
   * @example
   * const recentPosts = await postService.get_paginated_data_where_order(10, 0, { user_id: 1 }, 'created_at', false);
   * console.log(recentPosts); // Logs 10 latest posts by user 1
   */
  async get_paginated_data_where_order(limit, page, where, orderBy, ascending = true) {
    const start = page * limit;
    const end = start + limit - 1;
    let query = supabase.from(this.table).select('*');
    for (const [key, value] of Object.entries(where)) {
      query = query.eq(key, value);
    }
    query = query.order(orderBy, { ascending });
    const { data, error } = await query.range(start, end);
    if (error) throw new Error(`Error fetching paginated data with WHERE and ORDER: ${error.message}`);
    return data;
  }

  /**
   * Get a record by ID
   * @param {string|number} id - The record ID
   * @returns {Promise<Object>} - The matching record
   * @throws {Error} - If the query fails or no record is found
   * @example
   * const user = await userService.get_by_id(42);
   * console.log(user); // Logs user with ID 42
   */
  async get_by_id(id) {
    const { data, error } = await supabase.from(this.table).select('*').eq('id', id).single();
    if (error) throw new Error(`Error fetching record by ID: ${error.message}`);
    return data;
  }

  /**
   * Save a new record to the table
   * @param {Object} data - Data to insert
   * @returns {Promise<Object>} - The inserted record
   * @throws {Error} - If the insert fails
   * @example
   * const newUser = await userService.save({ name: 'Jane', email: 'jane@example.com' });
   * console.log(newUser); // Logs newly created user
   */
  async save(data) {
    const { data: savedData, error } = await supabase.from(this.table).insert([data]).select().single();
    if (error) throw new Error(`Error saving record: ${error.message}`);
    return savedData;
  }

  /**
   * Update a record by ID
   * @param {string|number} id - The record ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} - The updated record
   * @throws {Error} - If the update fails
   * @example
   * const updatedUser = await userService.update(42, { name: 'Jane Doe' });
   * console.log(updatedUser); // Logs updated user with ID 42
   */
  async update(id, data) {
    const { data: updatedData, error } = await supabase
      .from(this.table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Error updating record: ${error.message}`);
    return updatedData;
  }

  /**
   * Delete a record by ID
   * @param {string|number} id - The record ID
   * @returns {Promise<Object>} - The deleted record
   * @throws {Error} - If the delete fails
   * @example
   * const deletedUser = await userService.delete(42);
   * console.log(deletedUser); // Logs deleted user with ID 42
   */
  async delete(id) {
    const { data: deletedData, error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Error deleting record: ${error.message}`);
    return deletedData;
  }

  /**
   * Get records by a specific field and value
   * @param {string} field - The field name
   * @param {any} value - The field value
   * @returns {Promise<Array>} - Matching records
   * @throws {Error} - If the query fails
   * @example
   * const activeUsers = await userService.get_by_field('status', 'active');
   * console.log(activeUsers); // Logs all active users
   */
  async get_by_field(field, value) {
    const { data, error } = await supabase.from(this.table).select('*').eq(field, value);
    if (error) throw new Error(`Error fetching records by field: ${error.message}`);
    return data;
  }

  /**
   * Get records by multiple fields
   * @param {Object} fields - Key-value pairs for conditions
   * @returns {Promise<Array>} - Matching records
   * @throws {Error} - If the query fails
   * @example
   * const userPosts = await postService.get_by_fields({ user_id: 1, status: 'published' });
   * console.log(userPosts); // Logs published posts by user 1
   */
  async get_by_fields(fields) {
    let query = supabase.from(this.table).select('*');
    for (const [key, value] of Object.entries(fields)) {
      query = query.eq(key, value);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Error fetching records by fields: ${error.message}`);
    return data;
  }

  /**
   * Delete records by a specific field and value
   * @param {string} field - The field name
   * @param {any} value - The field value
   * @returns {Promise<Array>} - Deleted records
   * @throws {Error} - If the delete fails
   * @example
   * const deletedDrafts = await postService.delete_by_field('status', 'draft');
   * console.log(deletedDrafts); // Logs deleted draft posts
   */
  async delete_by_field(field, value) {
    const { data, error } = await supabase.from(this.table).delete().eq(field, value).select();
    if (error) throw new Error(`Error deleting records by field: ${error.message}`);
    return data;
  }

  // --- Storage Methods ---

  /**
   * Upload an image to a storage bucket
   * @param {string} bucket - The bucket name
   * @param {string} fileName - The file name
   * @param {File|Blob|string} file - The file to upload
   * @param {string} contentType - MIME type (e.g., 'image/jpeg')
   * @returns {Promise<Object>} - Upload response data
   * @throws {Error} - If the upload fails
   * @example
   * const file = document.querySelector('input[type="file"]').files[0];
   * await userService.upload_image('profiles', 'user42.jpg', file, 'image/jpeg');
   * console.log('Image uploaded!');
   */
  async upload_image(bucket, fileName, file, contentType) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { contentType, upsert: true });
    if (error) throw new Error(`Error uploading image: ${error.message}`);
    return data;
  }

  /**
   * Get the public URL of an image in a bucket
   * @param {string} bucket - The bucket name
   * @param {string} fileName - The file name
   * @returns {string} - Public URL of the image
   * @example
   * const profilePic = userService.get_image_url('profiles', 'user42.jpg');
   * console.log(profilePic); // Logs URL to user42.jpg
   */
  get_image_url(bucket, fileName) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  }

  /**
   * Delete an image from a bucket
   * @param {string} bucket - The bucket name
   * @param {string} fileName - The file name
   * @returns {Promise<Object>} - Delete response data
   * @throws {Error} - If the delete fails
   * @example
   * await userService.delete_image('profiles', 'user42.jpg');
   * console.log('Image deleted!');
   */
  async delete_image(bucket, fileName) {
    const { data, error } = await supabase.storage.from(bucket).remove([fileName]);
    if (error) throw new Error(`Error deleting image: ${error.message}`);
    return data;
  }

  /**
   * Upload multiple images to a bucket
   * @param {string} bucket - The bucket name
   * @param {Array<{fileName: string, file: File|Blob|string, contentType: string}>} files - Array of file objects
   * @returns {Promise<Array>} - Array of upload response data
   * @throws {Error} - If any upload fails
   * @example
   * const files = [
   *   { fileName: 'img1.jpg', file: file1, contentType: 'image/jpeg' },
   *   { fileName: 'img2.jpg', file: file2, contentType: 'image/jpeg' },
   * ];
   * await postService.upload_multiple_images('gallery', files);
   * console.log('Multiple images uploaded!');
   */
  async upload_multiple_images(bucket, files) {
    const uploadPromises = files.map(({ fileName, file, contentType }) =>
      this.upload_image(bucket, fileName, file, contentType)
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Delete multiple images from a bucket
   * @param {string} bucket - The bucket name
   * @param {Array<string>} fileNames - Array of file names
   * @returns {Promise<Object>} - Delete response data
   * @throws {Error} - If the delete fails
   * @example
   * await postService.delete_multiple_images('gallery', ['img1.jpg', 'img2.jpg']);
   * console.log('Multiple images deleted!');
   */
  async delete_multiple_images(bucket, fileNames) {
    const { data, error } = await supabase.storage.from(bucket).remove(fileNames);
    if (error) throw new Error(`Error deleting multiple images: ${error.message}`);
    return data;
  }
}

export default SupabaseService;