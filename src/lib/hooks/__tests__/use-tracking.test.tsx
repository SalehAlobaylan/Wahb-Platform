import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTrackingMutation } from '../use-feed';
import { useAuthStore } from '@/lib/stores/auth-store';
import { recordInteraction } from '@/lib/api/feeds';
jest.mock('@/lib/api/feeds',()=>({recordInteraction:jest.fn()}));
it('drops delayed observations whose account or public identity is no longer current',async()=>{
 useAuthStore.setState({user:null,isAuthenticated:false});
 const client=new QueryClient({defaultOptions:{mutations:{retry:false}}});
 const wrapper=({children}:{children:React.ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>;
 const view=renderHook(()=>useTrackingMutation(),{wrapper});
 await act(async()=>{await view.result.current.mutateAsync({contentId:'content',type:'progress',expectedIdentity:'previous-account'})});
 expect(recordInteraction).not.toHaveBeenCalled();
 await act(async()=>{await view.result.current.mutateAsync({contentId:'content',type:'progress',expectedIdentity:'public'})});
 expect(recordInteraction).toHaveBeenCalledTimes(1);
 view.unmount();client.clear();
});
