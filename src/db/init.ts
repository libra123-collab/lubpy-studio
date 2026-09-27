import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { storage } from './storage.ts';

export async function initializeDatabase(pool: Pool) {
  let client: any;
  let adminPool: Pool | null = null;

  try {
    if (process.env.SQL_ADMIN_USER && process.env.SQL_ADMIN_PASSWORD && process.env.SQL_HOST) {
      try {
        adminPool = new Pool({
          host: process.env.SQL_HOST,
          user: process.env.SQL_ADMIN_USER,
          password: process.env.SQL_ADMIN_PASSWORD,
          database: process.env.SQL_DB_NAME,
          port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
        });
        client = await adminPool.connect();
      } catch {
        client = await pool.connect();
      }
    } else {
      client = await pool.connect();
    }

    try {
      console.log('🔄 Checking and verifying PostgreSQL database tables...');

      // 1. Upgrade existing tables with missing columns if needed
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_department_head BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS department_title TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS dob TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS hometown TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS work_environment TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS experience TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS competence TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS career_goals TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_code TEXT;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id TEXT;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_email TEXT;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_phone TEXT;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS deposit_amount BIGINT DEFAULT 0;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS remaining_amount BIGINT DEFAULT 0;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_cs_id TEXT;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS documents TEXT;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS reports TEXT;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by TEXT;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_code TEXT;
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_by TEXT;
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS confirmed_by TEXT;
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_code TEXT;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_id TEXT;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_email TEXT;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_phone TEXT;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS project_id TEXT;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS messages TEXT;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;

        ALTER TABLE live_chats ADD COLUMN IF NOT EXISTS sender_id TEXT;

        ALTER TABLE interviews ADD COLUMN IF NOT EXISTS candidate_phone TEXT;
        ALTER TABLE interviews ADD COLUMN IF NOT EXISTS notes TEXT;

        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'SYSTEM';
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_user_id TEXT;
      `);

      // 2. Create tables if not existing
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          uid TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT,
          role TEXT NOT NULL DEFAULT 'CLIENT',
          is_department_head BOOLEAN DEFAULT FALSE,
          department TEXT,
          department_title TEXT,
          phone TEXT,
          dob TEXT,
          hometown TEXT,
          avatar TEXT,
          photo_url TEXT,
          occupation TEXT,
          work_environment TEXT,
          experience TEXT,
          competence TEXT,
          skills TEXT,
          career_goals TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          project_code TEXT,
          client_id TEXT,
          client_name TEXT NOT NULL,
          client_email TEXT,
          client_phone TEXT,
          title TEXT NOT NULL,
          description TEXT,
          project_type TEXT,
          tech_stack TEXT,
          deadline TEXT,
          status TEXT NOT NULL DEFAULT 'PENDING',
          progress INTEGER DEFAULT 0,
          price_vnd BIGINT DEFAULT 0,
          deposit_amount BIGINT DEFAULT 0,
          remaining_amount BIGINT DEFAULT 0,
          dev_commission_rate INTEGER DEFAULT 65,
          assigned_dev_id TEXT,
          assigned_dev_name TEXT,
          assigned_cs_id TEXT,
          assigned_cs_name TEXT,
          thumbnail_url TEXT,
          feedback TEXT,
          documents TEXT,
          reports TEXT,
          created_by TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP,
          delivered_at TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS project_assignments (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          user_name TEXT NOT NULL,
          role TEXT NOT NULL,
          assigned_by TEXT NOT NULL,
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS project_status_history (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL,
          old_status TEXT NOT NULL,
          new_status TEXT NOT NULL,
          changed_by TEXT NOT NULL,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id SERIAL PRIMARY KEY,
          transaction_code TEXT,
          project_id TEXT,
          project_name TEXT,
          type TEXT NOT NULL,
          amount_vnd BIGINT NOT NULL,
          sender_name TEXT,
          receiver_name TEXT,
          status TEXT NOT NULL DEFAULT 'completed',
          note TEXT,
          created_by TEXT,
          confirmed_by TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          confirmed_at TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tickets (
          id TEXT PRIMARY KEY,
          ticket_code TEXT,
          client_id TEXT,
          client_name TEXT NOT NULL,
          client_email TEXT,
          client_phone TEXT,
          project_id TEXT,
          subject TEXT NOT NULL,
          description TEXT,
          priority TEXT NOT NULL DEFAULT 'MEDIUM',
          status TEXT NOT NULL DEFAULT 'OPEN',
          assigned_cs TEXT,
          messages TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS live_chats (
          id SERIAL PRIMARY KEY,
          session_id TEXT NOT NULL,
          sender_id TEXT,
          sender TEXT NOT NULL,
          sender_role TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS interviews (
          id TEXT PRIMARY KEY,
          candidate_name TEXT NOT NULL,
          candidate_email TEXT,
          candidate_phone TEXT,
          role TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Confirmed',
          interviewer TEXT,
          notes TEXT,
          avatar TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS project_files (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_type TEXT,
          file_size INTEGER,
          uploaded_by TEXT,
          is_locked BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL DEFAULT 'SYSTEM',
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          target_dept TEXT NOT NULL DEFAULT 'ALL',
          target_user_id TEXT,
          is_read TEXT DEFAULT 'false',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          action TEXT NOT NULL,
          entity_type TEXT,
          entity_id TEXT,
          user_id TEXT,
          user_name TEXT,
          user_role TEXT,
          details TEXT,
          ip_address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS server_logs (
          id SERIAL PRIMARY KEY,
          server_name TEXT NOT NULL,
          log_level TEXT NOT NULL DEFAULT 'INFO',
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS otp_codes (
          id SERIAL PRIMARY KEY,
          target TEXT NOT NULL,
          code TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Performance Indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
        CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
        CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
        CREATE INDEX IF NOT EXISTS idx_projects_assigned_dev ON projects(assigned_dev_id);
        CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
        CREATE INDEX IF NOT EXISTS idx_tickets_project_id ON tickets(project_id);
        CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
        CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
        CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications(target_user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_target_dept ON notifications(target_dept);
        CREATE INDEX IF NOT EXISTS idx_live_chats_session ON live_chats(session_id);
      `);

      // 4. Update any existing accounts without password hashes
      const salt = bcrypt.genSaltSync(10);
      const adminHash = bcrypt.hashSync('admin123', salt);
      const techHash = bcrypt.hashSync('tech2026', salt);
      const csHash = bcrypt.hashSync('cs2026', salt);
      const hrHash = bcrypt.hashSync('hr2026', salt);
      const accHash = bcrypt.hashSync('acc2026', salt);
      const clientHash = bcrypt.hashSync('123456', salt);

      // Populate password hash for existing unhashed accounts
      await client.query(`
        UPDATE users SET password_hash = CASE
          WHEN email = 'admin@lubpy.com' THEN $1
          WHEN email = 'tech@lubpy.com' THEN $2
          WHEN email = 'accounting@lubpy.com' THEN $3
          WHEN email = 'hr@lubpy.com' THEN $4
          WHEN email = 'cskh@lubpy.com' THEN $5
          ELSE $6
        END
        WHERE password_hash IS NULL;
      `, [adminHash, techHash, accHash, hrHash, csHash, clientHash]).catch((err) => {
        console.warn('Notice updating password hashes:', err.message);
      });

      // 5. Seed essential standard accounts if missing
      const initialUsers = [
        {
          uid: 'usr_superadmin',
          name: 'LUBPY Super Admin',
          email: 'superadmin@lubpystudio.vn',
          password_hash: adminHash,
          role: 'SUPER_ADMIN',
          is_department_head: true,
          department: 'Ban Quản Trị Hệ Thống',
          department_title: 'Tổng Giám Đốc / Super Admin',
          phone: '0901888999',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=superadmin_king_01&backgroundColor=0f172a',
        },
        {
          uid: 'usr_tech_lead',
          name: 'Phan Quốc Bảo (Tech Lead)',
          email: 'truetechengineer@lubpystudio.vn',
          password_hash: techHash,
          role: 'TECH_LEAD',
          is_department_head: true,
          department: 'Đội Ngũ Kỹ Thuật (Tech Team)',
          department_title: 'Trưởng Đội Ngũ Kỹ Thuật (Tech Lead)',
          phone: '0903112233',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=techlead_bao&backgroundColor=0f172a',
        },
        {
          uid: 'usr_dev_senior',
          name: 'Trần Hoàng Nam (Senior Developer)',
          email: 'techengineer@lubpystudio.vn',
          password_hash: techHash,
          role: 'DEVELOPER',
          is_department_head: false,
          department: 'Đội Ngũ Kỹ Thuật (Tech Team)',
          department_title: 'Lập Trình Viên Cao Cấp (Senior Dev)',
          phone: '0903445566',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=dev_nam&backgroundColor=0f172a',
        },
        {
          uid: 'usr_cs_head',
          name: 'Đặng Ngọc Mai (Trưởng CSKH & Tư Vấn)',
          email: 'truecs@lubpystudio.vn',
          password_hash: csHash,
          role: 'CS',
          is_department_head: true,
          department: 'Chăm Sóc Khách Hàng (CS Team)',
          department_title: 'Trưởng Bộ Phận Tư Vấn CSKH',
          phone: '0905778899',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=cshead_mai&backgroundColor=0f172a',
        },
        {
          uid: 'usr_cs_staff',
          name: 'Vũ Thùy Linh (Chuyên viên CSKH)',
          email: 'cs@lubpystudio.vn',
          password_hash: csHash,
          role: 'CS',
          is_department_head: false,
          department: 'Chăm Sóc Khách Hàng (CS Team)',
          department_title: 'Chuyên Viên Tư Vấn Khách Hàng',
          phone: '0905112244',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=cs_linh&backgroundColor=0f172a',
        },
        {
          uid: 'usr_acc_head',
          name: 'Nguyễn Văn Minh (Kế Toán Trưởng)',
          email: 'trueaccounting@lubpystudio.vn',
          password_hash: accHash,
          role: 'ACCOUNTING',
          is_department_head: true,
          department: 'Tài Chính & Kế Toán (Accounting)',
          department_title: 'Trưởng Phòng Kế Toán & Tài Chính',
          phone: '0908334455',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=acc_minh&backgroundColor=0f172a',
        },
        {
          uid: 'usr_acc_staff',
          name: 'Đỗ Thị Yến (Chuyên Viên Kế Toán)',
          email: 'accounting@lubpystudio.vn',
          password_hash: accHash,
          role: 'ACCOUNTING',
          is_department_head: false,
          department: 'Tài Chính & Kế Toán (Accounting)',
          department_title: 'Chuyên Viên Kiểm Soát Doanh Thu',
          phone: '0908667788',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=acc_yen&backgroundColor=0f172a',
        },
        {
          uid: 'usr_hr_head',
          name: 'Lê Thị Thanh Hương (Trưởng Phòng Nhân Sự HR)',
          email: 'truehr@lubpystudio.vn',
          password_hash: hrHash,
          role: 'HR',
          is_department_head: true,
          department: 'Hành Chính & Nhân Sự (HR)',
          department_title: 'Trưởng Bộ Phận Nhân Sự & Tuyển Dụng',
          phone: '0909112233',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hr_huong&backgroundColor=0f172a',
        },
        {
          uid: 'usr_hr_staff',
          name: 'Phạm Hồng Ánh (Chuyên Viên Tuyển Dụng)',
          email: 'hr@lubpystudio.vn',
          password_hash: hrHash,
          role: 'HR',
          is_department_head: false,
          department: 'Hành Chính & Nhân Sự (HR)',
          department_title: 'Chuyên Viên Tuyển Dụng Lập Trình Viên',
          phone: '0909445566',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hr_anh&backgroundColor=0f172a',
        },
        {
          uid: 'usr_client_01',
          name: 'Nguyễn Văn Hải',
          email: 'client@gmail.com',
          password_hash: clientHash,
          role: 'CLIENT',
          is_department_head: false,
          phone: '0912345678',
          dob: '2003-05-15',
          hometown: 'TP. Hồ Chí Minh',
          occupation: 'Sinh viên Công Nghệ Thông Tin',
          work_environment: 'Đại học Bách Khoa TP.HCM (Khách hàng Học viên)',
          avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hai_client&backgroundColor=0f172a',
        },
      ];

      for (const u of initialUsers) {
        await client.query(`
          INSERT INTO users (uid, name, email, password_hash, role, is_department_head, department, department_title, phone, dob, hometown, occupation, work_environment, avatar, photo_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
          ON CONFLICT (email) DO UPDATE SET password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash);
        `, [
          u.uid, u.name, u.email, u.password_hash, u.role, u.is_department_head,
          u.department || null, u.department_title || null, u.phone || null,
          u.dob || null, u.hometown || null, u.occupation || null,
          u.work_environment || null, u.avatar
        ]);
      }

      // 6. Seed sample projects if table has 0 projects
      const prjCountRes = await client.query('SELECT COUNT(*) as count FROM projects');
      const prjCount = parseInt(prjCountRes.rows[0]?.count || '0', 10);

      if (prjCount === 0) {
        console.log('🌱 Seeding initial projects and financial transactions...');
        await client.query(`
          INSERT INTO projects (
            id, project_code, client_id, client_name, client_email, client_phone,
            title, description, project_type, tech_stack, deadline, status, progress,
            price_vnd, deposit_amount, remaining_amount, dev_commission_rate,
            assigned_dev_name, assigned_cs_name, documents, reports
          ) VALUES
          (
            'PRJ-2401', 'PRJ-2401', 'usr_client_01', 'Nguyễn Văn Hải', 'client@gmail.com', '0912345678',
            'Xây dựng Website TMĐT Tích hợp Gợi ý AI (Machine Learning)',
            'Hệ thống thương mại điện tử đa kênh viết bằng ReactJS, Node.js Express, PostgreSQL và kết nối Python AI Recommender System.',
            'Graduation Thesis / Đồ án tốt nghiệp',
            '["React", "Node.js", "PostgreSQL", "Python (AI)"]',
            '15/08/2026', 'CODING', 75,
            15000000, 7500000, 7500000, 65,
            'Phan Quốc Bảo (Lead Dev)', 'Đặng Ngọc Mai (Consultant)',
            '[{"name":"Source_Code_Web_Ecommerce_v1.2.zip","url":"#","uploadedAt":"05/08/2026"},{"name":"Bao_Cao_Do_An_Tot_Nghiep_Full_Word.docx","url":"#","uploadedAt":"02/08/2026"},{"name":"So_Do_Thuc_The_ERD_Database.pdf","url":"#","uploadedAt":"28/07/2026"},{"name":"Slide_Thuyet_Trinh_Bao_Ve_Do_An.pptx","url":"#","uploadedAt":"06/08/2026"}]',
            '[{"author":"LUBPY Tech Team","content":"Đã thiết kế xong CSDL PostgreSQL và dựng xong 12 API Backend chính.","timestamp":"20/07/2026 10:00"},{"author":"LUBPY Tech Team","content":"Đã kết nối Model AI gợi ý sản phẩm và hoàn thiện giao diện Client Dashboard.","timestamp":"05/08/2026 15:30"}]'
          ),
          (
            'PRJ-2402', 'PRJ-2402', 'usr_client_02', 'Trần Minh Quân', 'quan.tran@gmail.com', '0988776655',
            'App Mobile Quản Lý Chi Tiêu Cá Nhân OCR',
            'Ứng dụng di động Flutter nhận diện hóa đơn tự động qua Google Cloud Vision OCR, đồng bộ dữ liệu đám mây Firebase.',
            'Capstone Project / Đồ án nhóm',
            '["Flutter", "Firebase", "Google Cloud OCR"]',
            '01/09/2026', 'DEPOSIT_50', 35,
            12000000, 6000000, 6000000, 65,
            'Trần Hoàng Nam (Senior Dev)', 'Đặng Ngọc Mai (Consultant)',
            '[{"name":"SRS_Yeu_Cau_Phan_Mem_Mobile.pdf","url":"#","uploadedAt":"28/07/2026"},{"name":"Database_Schema_ERD_Diagram.pdf","url":"#","uploadedAt":"28/07/2026"}]',
            '[{"author":"LUBPY Tech Team","content":"Khách hàng đã thanh toán đợt 1 (50%). Team Mobile đang dựng CSDL & UI Flutter.","timestamp":"28/07/2026 16:30"}]'
          )
          ON CONFLICT (id) DO NOTHING;
        `);

        // Seed initial transactions
        await client.query(`
          INSERT INTO transactions (project_id, project_name, type, amount_vnd, sender_name, receiver_name, status, note)
          VALUES 
          ('PRJ-2401', 'Website TMĐT AI Recommender', 'PROJECT_DEPOSIT', 7500000, 'Nguyễn Văn Hải', 'LUBPY Studio', 'completed', 'Thanh toán cọc 50% Hợp đồng Đồ án PRJ-2401'),
          ('PRJ-2402', 'App Quản lý Chi tiêu OCR', 'PROJECT_DEPOSIT', 6000000, 'Trần Minh Quân', 'LUBPY Studio', 'completed', 'Thanh toán cọc 50% Hợp đồng Đồ án PRJ-2402')
          ON CONFLICT DO NOTHING;
        `);

        // Seed initial tickets
        await client.query(`
          INSERT INTO tickets (id, ticket_code, client_name, client_email, client_phone, project_id, subject, description, priority, status, assigned_cs, messages)
          VALUES (
            'TCK-701', 'TCK-701', 'Nguyễn Văn Hải', 'client@gmail.com', '0912345678', 'PRJ-2401',
            'Yêu cầu tinh chỉnh cấu trúc bảng CSDL (ERD)',
            'Em muốn xin thêm sơ đồ thực thể liên kết (ERD) dạng PDF sắc nét để dán vào file Word báo cáo nộp thầy hướng dẫn.',
            'HIGH', 'OPEN', 'Đặng Ngọc Mai (Consultant)',
            '[{"sender":"Client","content":"Chào LUBPY, mình muốn xin thêm sơ đồ thực thể liên kết (ERD) dạng PDF để vẽ báo cáo word được không?","timestamp":"19/07/2026 14:20"},{"sender":"CS","content":"Chào Hải nhé, yêu cầu của bạn đã được lưu lại. Team tư vấn đang liên hệ với Lead Dev để xuất file PDF chất lượng cao gửi bạn ngay trong hôm nay nhé!","timestamp":"19/07/2026 14:45"}]'
          )
          ON CONFLICT (id) DO NOTHING;
        `);

        // Seed initial notifications
        await client.query(`
          INSERT INTO notifications (type, title, content, target_dept, is_read)
          VALUES
          ('PROJECT', 'Dự án mới PRJ-2401 đã được tiếp nhận', 'Khách hàng Nguyễn Văn Hải đã nạp cọc 50% cho đồ án Website TMĐT AI.', 'ALL', 'false'),
          ('PAYMENT', 'Kế toán xác nhận giao dịch cọc 7.500.000 VNĐ', 'Giao dịch qua VNPAY / Ngân hàng MB Bank đã hoàn tất đối soát.', 'ACCOUNTING', 'false'),
          ('HR', 'Phỏng vấn ứng viên Fullstack Developer', 'Lịch phỏng vấn với ứng viên Nguyễn Thế Phong lúc 14:00 ngày 15/08.', 'HR', 'false')
        `);
      }

      console.log('✅ PostgreSQL database tables verified and initialized successfully.');
      storage.setPostgresStatus(true);
    } finally {
      if (client) {
        client.release();
      }
      if (adminPool) {
        await adminPool.end().catch(() => {});
      }
    }
  } catch (err: any) {
    storage.setPostgresStatus(false);
    console.error('❌ PostgreSQL database initialization failed:', err.message || err);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`FATAL_DATABASE_INIT_FAILURE: ${err.message || 'Could not connect to PostgreSQL'}`);
    }
  }
}
