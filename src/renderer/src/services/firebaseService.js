import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import dayjs from 'dayjs';
import { db } from '../firebase/fire';

export class FirebaseService {
  static sessionsRef = collection(db, 'sessions');

  // Save a time session (enforce one session per user per day)
  static async saveSession(userId, session) {
    try {
      const dateKey = dayjs(session.date).format('YYYY-MM-DD');
      const sessionId = `${userId}_${dateKey}`;
      const sessionRef = doc(db, 'sessions', sessionId);

      const sessionData = {
        ...session,
        id: sessionId,
        userId,
        date: dateKey,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(sessionRef, sessionData);
      return sessionId;
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  // Get all sessions for a user (latest first)
  static async getUserSessions(userId) {
    try {
      const q = query(
        this.sessionsRef,
        where('userId', '==', userId),
        orderBy('date', 'desc') // !Note can we use orderBy('createdAt', 'desc') instead?
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw error;
    }
  }

  // Check if user has already submitted a session today
  static async getTodaySession(userId) {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const sessionId = `${userId}_${today}`;

      const docRef = doc(db, 'sessions', sessionId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.status === 'submitted' ? data : null;
      }

      return null;
    } catch (error) {
      console.error('Error checking today session:', error);
      throw error;
    }
  }

  // Delete a session
  static async deleteSession(sessionId){
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  // Update session approval status
  static async updateSessionApproval(
    sessionId,
    approvalStatus,
    approvalComment,
    approvedBy
  ) {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        approvalStatus,
        approvalComment: approvalComment || '',
        approvedBy: approvedBy || '',
        approvedAt: dayjs().toISOString(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating session approval:', error);
      throw error;
    }
  }

  // Get user sessions between dates
  static async getSessionsByDateRange(
    userId,
    startDate,
    endDate
  ) {
    try {
      const start = dayjs(startDate).format('YYYY-MM-DD');
      const end = dayjs(endDate).format('YYYY-MM-DD');

      const q = query(
        this.sessionsRef,
        where('userId', '==', userId),
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error('Error fetching date range sessions:', error);
      throw error;
    }
  }

  // Get all sessions by date range (for admin)
  static async getAllSessionsByDateRange(startDate, endDate) {
    try {
      const start = dayjs(startDate).format('YYYY-MM-DD');
      const end = dayjs(endDate).format('YYYY-MM-DD');

      const q = query(
        this.sessionsRef,
        where('date', '>=', start),
        where('date', '<=', end),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error('Error fetching all sessions by date range:', error);
      throw error;
    }
  }
}
